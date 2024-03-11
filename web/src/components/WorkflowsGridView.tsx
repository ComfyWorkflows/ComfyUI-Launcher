'use client'

import { Project, Settings } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { Masonry } from 'masonic'
import ProjectCard from './ProjectCard'

function WorkflowsGridView() {
    const getProjectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await fetch(`/api/projects`)
            const data = (await response.json()) as Project[]
            return data
        },
        refetchInterval: 10_000, // refetch every 10 seconds
    })

    const getSettingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const response = await fetch(`/api/settings`)
            const data = await response.json()
            return data as Settings
        },
    })

    if (getProjectsQuery.isError || getSettingsQuery.isError) {
        return <div>Something went wrong, please refresh the page.</div>
    }

    if (getProjectsQuery.isLoading || getSettingsQuery.isLoading) {
        return <div>Loading...</div>
    }
    
    if (!getSettingsQuery.data || !getProjectsQuery.data || getProjectsQuery.data.length === 0) {
        return <></>
    }

    return (
        <div>
            <Masonry
                key={getProjectsQuery.data.map((p) => p.id).join(',')}
                itemKey={(item, index) =>
                    item === undefined ? index : item.id
                }
                columnGutter={20}
                columnWidth={350}
                items={getProjectsQuery.data}
                render={(props) => <ProjectCard settings={getSettingsQuery.data} item={props.data} />}
            />
        </div>
    )
}

export default WorkflowsGridView
