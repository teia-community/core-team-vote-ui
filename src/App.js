import React from 'react';
import { Outlet } from 'react-router-dom';
import { CoreTeamVoteContextProvider } from './containers/context';
import { Header } from './containers/header';
import { Footer } from './containers/footer';
import { Parameters } from './containers/parameters';
import { Proposals } from './containers/proposals';
import { CreateProposalForms } from './containers/forms';


export function App() {
    return (
        <CoreTeamVoteContextProvider>
            <div className='app-container'>
                <Header />
                <Outlet />
                <Footer />
            </div>
        </CoreTeamVoteContextProvider>
    );
}

export function CoreTeamVoteParameters() {
    return (
        <main>
            <h1>Teia Core Team Vote parameters</h1>
            <Parameters />
        </main>
    );
}

export function MultiOptionProposals() {
    return (
        <main>
            <h1>Teia Core Team multi-option proposals</h1>
            <Proposals />
        </main>
    );
}

export function CreateProposals() {
    return (
        <main>
            <h1>Create new proposals</h1>
            <CreateProposalForms />
        </main>
    );
}

export function NotFound() {
    return (
        <main>
            <p>Page not found...</p>
        </main>
    );
}
