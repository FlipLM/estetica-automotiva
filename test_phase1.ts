import { prisma } from "./src/lib/prisma";
import { comparePassword, hashPassword, signToken, verifyToken } from "./src/lib/auth";

async function runTests() {
  console.log("==================================================");
  console.log("   TESTES AUTOMATIZADOS DA FASE 1 — AUTH & RBAC   ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Teste 1: Conexão com o Banco de Dados
    const tenantsCount = await prisma.tenant.count();
    assert(tenantsCount > 0, "Banco de dados conectado e com tenants existentes.");

    // Teste 2: Hashing de Senhas com Bcrypt
    const testPassword = "senhaSegura123!";
    const hash = await hashPassword(testPassword);
    const isValid = await comparePassword(testPassword, hash);
    const isInvalid = await comparePassword("senhaErrada", hash);
    assert(isValid && !isInvalid, "Hash e validação de senhas com bcrypt funcionando com precisão.");

    // Teste 3: Emissão e Validação de JWT
    const token = await signToken({
      userId: "test-user-id",
      tenantId: "test-tenant-id",
      email: "teste@empresa.com",
      name: "Usuário Teste",
      role: "ADMIN",
    });
    const payload = await verifyToken(token);
    assert(
      payload !== null && payload.email === "teste@empresa.com" && payload.role === "ADMIN",
      "Emissão e verificação de JWT criptografado íntegros."
    );

    // Teste 4: Consulta de Usuários do Seed e Verificação de RBAC
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@detailing.com" },
      include: { tenant: true },
    });
    assert(
      adminUser !== null && adminUser.role === "ADMIN" && adminUser.tenant.name.includes("Prime"),
      "Usuário Administrador cadastrado com perfil 'ADMIN' e vínculo de Tenant."
    );

    const operatorUser = await prisma.user.findFirst({
      where: { email: "operador@detailing.com" },
    });
    assert(
      operatorUser !== null && operatorUser.role === "OPERATOR",
      "Usuário Operador cadastrado com perfil 'OPERATOR'."
    );

    // Teste 5: Isolamento de Dados por Tenant (Cross-tenant leak prevention)
    const orders = await prisma.serviceOrder.findMany({
      where: { tenantId: adminUser!.tenantId },
    });
    assert(orders.length >= 3, "Ordens de serviço vinculadas estritamente ao tenant correto.");

    console.log("--------------------------------------------------");
    console.log(`Resultado Final: ${passed} testes aprovados | ${failed} falhas.`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Erro durante a execução dos testes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

