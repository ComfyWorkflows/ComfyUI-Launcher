"use client"

import Link from "next/link"
import * as React from "react"

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"

export function Nav() {
    return (
        <NavigationMenu className="px-5 py-2">
            <Link href="/">
                <div className="font-mono font-semibold mr-2">ComfyUI Launcher</div>
            </Link>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <Link href="/" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                            Workflows
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink onClick={async (e) => {
                        e.preventDefault();
                        await fetch("/api/open_models_folder");
                    }} className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                        Models
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/settings" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                            Settings
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}