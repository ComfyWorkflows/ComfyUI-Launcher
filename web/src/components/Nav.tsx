'use client'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

export function Nav() {
    return (
        <NavigationMenu className="px-5 py-2">
            <a href="/">
                <div className="font-mono font-semibold mr-2">
                    ComfyUI Launcher
                </div>
            </a>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <a href="/">
                        <NavigationMenuLink
                            className={navigationMenuTriggerStyle()}
                        >
                            Workflows
                        </NavigationMenuLink>
                    </a>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        onClick={async (e) => {
                            e.preventDefault()
                            await fetch('/api/open_models_folder')
                        }}
                        className={`${navigationMenuTriggerStyle()} cursor-pointer`}
                    >
                        Models
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <a href="/settings">
                        <NavigationMenuLink
                            className={navigationMenuTriggerStyle()}
                        >
                            Settings
                        </NavigationMenuLink>
                    </a>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}
