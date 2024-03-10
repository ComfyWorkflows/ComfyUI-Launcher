'use client'

import { useMutation } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useToast } from './ui/use-toast'
import { Button } from './ui/button'
import { Config } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

function SettingsUI() {
    const [civitaiApiKey, setCivitaiApiKey] = React.useState<string>()

    const getSettingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const resp = await fetch('/api/get_config')
            const data = (await resp.json()) as Config
            return data
        },
        enabled: !civitaiApiKey,
    })

    useEffect(() => {
        if (getSettingsQuery.data) {
            setCivitaiApiKey(getSettingsQuery.data.credentials.civitai.apikey)
        }
    }, [getSettingsQuery.data])

    const { toast } = useToast()

    const setCivitaiCredentialsMutation = useMutation({
        mutationFn: async ({
            civitai_api_key,
        }: {
            civitai_api_key: string
        }) => {
            const response = await fetch(`/api/update_config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credentials: {
                        civitai: {
                            apikey: civitai_api_key,
                        },
                    },
                }),
            })
            const data = await response.json()
            return data
        },
        onSuccess: async () => {
            toast({
                title: 'Saved your settings!',
            })
        },
    })

    if (getSettingsQuery.isLoading) {
        return <div>Loading...</div>
    }

    return (
        <>
            <div className="flex flex-col p-10">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="name" className="text-left">
                        CivitAI API Key
                    </Label>
                    <Input
                        id="name"
                        placeholder="Your CivitAI API key"
                        className="w-fit"
                        value={civitaiApiKey}
                        required
                        onChange={(e) => setCivitaiApiKey(e.target.value)}
                    />
                    <p className="text-xs font-medium text-gray-600">
                        You can get your CivitAI API key from your{' '}
                        <a
                            href="https://civitai.com/user/account"
                            target="_blank"
                            rel="noreferrer"
                        >
                            CivitAI account settings page
                        </a>
                        .
                        <br />
                        Scroll to the bottom of the page to the section titled
                        &quot;API Keys&quot;, and create one.
                        <br />
                        <br />
                        This key is saved locally and ONLY used to download
                        missing models directly from CivitAI. It is NEVER sent
                        anywhere else.
                    </p>
                </div>
                <div>
                    <Button
                        onClick={(e) => {
                            e.preventDefault()
                            setCivitaiCredentialsMutation.mutate({
                                civitai_api_key: civitaiApiKey || '',
                            })
                        }}
                        variant="default"
                        className="mt-5"
                    >
                        {setCivitaiCredentialsMutation.isPending
                            ? 'Saving...'
                            : 'Save'}
                    </Button>
                </div>
            </div>
        </>
    )
}

export default SettingsUI
