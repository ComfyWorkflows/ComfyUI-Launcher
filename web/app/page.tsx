import { Nav } from "@/components/Nav";
import WorkflowsGridView from "@/components/WorkflowsGridView";
import Link from "next/link";

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col">
      <div>
        <Nav />
      </div>

      <div className="flex flex-row space-x-5 p-5">
        <Link href="/new">
          <div className="hover:bg-gray-200 cursor-pointer flex flex-col w-fit h-fit rounded-md bg-gray-100 p-5 border border-gray-300">
            <h1 className="text-lg font-semibold">Create workflow</h1>
            <p className="mt-1 font-medium text-sm text-gray-500">Create a new ComfyUI project</p>
          </div>
        </Link>
        <Link href="/import">
          <div className="hover:bg-gray-200 cursor-pointer flex flex-col w-fit h-fit rounded-md bg-gray-100 p-5 border border-gray-300">
            <h1 className="text-lg font-semibold">Import workflow</h1>
            <p className="mt-1 font-medium text-sm text-gray-500">Run an existing workflow with zero setup</p>
          </div>
        </Link>
      </div>

      <div className="flex flex-col mt-5 p-5">
        <WorkflowsGridView />
      </div>
    </main>
  );
}
