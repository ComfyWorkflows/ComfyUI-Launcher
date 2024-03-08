import { Nav } from '@/components/Nav'
import NewWorkflowUI from '@/components/NewWorkflowUI'

export default function NewWorkflowPage() {
    return (
        <main className="flex min-h-screen flex-col">
            <div>
                <Nav />
            </div>

            <NewWorkflowUI />
        </main>
    )
}
