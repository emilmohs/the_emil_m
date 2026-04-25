import prisma from "@/lib/prisma";

export default async function DebugPage() {
  let result = "";
  try {
    // @ts-ignore
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    result = JSON.stringify(tables, null, 2);
  } catch (e: any) {
    result = "Error: " + e.message;
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Database Debug</h1>
      <pre className="bg-gray-100 p-4 rounded">{result}</pre>
      <div className="mt-4">
        <p>Configured Path in prisma-init.ts was targeted to prisma/dev.db</p>
      </div>
    </div>
  );
}
