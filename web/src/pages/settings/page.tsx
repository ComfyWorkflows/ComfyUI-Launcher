import { Nav } from '@/components/Nav'
import SettingsUI from '@/components/SettingsUI'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
    return (
        <main className="flex min-h-screen flex-col">
            <div>
                <Nav />
            </div>

            <SettingsUI />
        </main>
    )
}
