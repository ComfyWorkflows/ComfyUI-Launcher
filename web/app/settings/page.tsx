import { Nav } from "@/components/Nav";
import SettingsUI from "@/components/SettingsUI";
import { Config } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_COMFYUI_LAUNCHER_SERVER_URL}/get_config`);
    const data = (await resp.json()) as Config;
    return (
        <main className="flex min-h-screen flex-col">
            <div>
                <Nav />
            </div>

            <SettingsUI initialConfig={data} />
        </main>
    );
}