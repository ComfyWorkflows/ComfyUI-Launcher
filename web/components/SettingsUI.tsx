'use client';

import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Config } from '@/lib/types';

function SettingsUI({ initialConfig }: { initialConfig: Config }) {
    const [isServerSide, setIsServerSide] = React.useState(true)
    const [civitaiApiKey, setCivitaiApiKey] = React.useState(initialConfig.credentials.civitai.apikey);

    React.useEffect(() => {
        console.log({ initialConfig });
        setIsServerSide(false)
    }, [])

    const { toast } = useToast()


    const setCivitaiCredentialsMutation = useMutation({
        mutationFn: async ({ civitai_api_key }: { civitai_api_key: string }) => {
            const response = await fetch(`/api/update_config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "credentials": {
                        "civitai": {
                            "apikey": civitai_api_key
                        }
                    }
                })
            })
            const data = await response.json()
            return data
        },
        onSuccess: async () => {
            toast({
                title: "Saved your settings!",
            });
        }
    })


    if (isServerSide) {
        return
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
                        You can get your CivitAI API key from your <a href="https://civitai.com/user/account" target="_blank" rel="noreferrer">CivitAI account settings page</a>.
                        <br/>Scroll to the bottom of the page to the section titled "API Keys", and create one.
                        <br/><br/>
                        This key is saved locally and ONLY used to download missing models directly from CivitAI. It is NEVER sent anywhere else.
                    </p>
                </div>
                <div>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            setCivitaiCredentialsMutation.mutate({ civitai_api_key: civitaiApiKey || "" });
                        }}
                        variant="default"
                        className='mt-5'
                    >{setCivitaiCredentialsMutation.isPending ? "Saving..." : "Save"}</Button>
                </div>
            </div>
        </>
    )
}

export default SettingsUI