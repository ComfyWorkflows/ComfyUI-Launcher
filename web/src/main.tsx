import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import IndexPage from './pages/index'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ImportWorkflowPage from './pages/import/page'
import NewWorkflowPage from './pages/new/page'
import SettingsPage from './pages/settings/page'
import { Toaster } from '@/components/ui/sonner'

// Create a client
const queryClient = new QueryClient()

const router = createBrowserRouter([
    {
        path: '/',
        element: <IndexPage />,
    },
    {
        path: '/import',
        element: <ImportWorkflowPage />,
    },
    {
        path: '/new',
        element: <NewWorkflowPage />,
    },
    {
        path: '/settings',
        element: <SettingsPage />,
    },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
        </QueryClientProvider>
    </React.StrictMode>
)
