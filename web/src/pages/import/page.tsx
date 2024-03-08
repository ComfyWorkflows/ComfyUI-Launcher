import { Nav } from '@/components/Nav'
import ImportWorkflowUI from '@/components/ImportWorkflowUI'

export default function ImportWorkflowPage() {
    return (
        <main className="flex min-h-screen flex-col">
            <div>
                <Nav />
            </div>

            <ImportWorkflowUI />
        </main>
    )
}
