import React, { useContext } from 'react';
import { NETWORK } from '../constants';
import { CoreTeamVoteContext } from './context';
import { TezosAddressLink } from './links';


export function Parameters() {
    // Get the required context information
    const { userAddress, contractAddress, storage, multisigStorage } = useContext(CoreTeamVoteContext);

    return (
        <section>
            <h2>Main parameters</h2>
            <ul className='parameters-list'>
                <li>Core team users:
                    <ul className='users-list'>
                        {multisigStorage?.users.map((user, index) => (
                            <li key={index}>
                                <TezosAddressLink
                                    address={user}
                                    className={user === userAddress && 'is-user'}
                                    useAlias
                                />
                            </li>
                        ))}
                    </ul>
                </li>
                <li>Contract address: <TezosAddressLink address={contractAddress} /></li>
                <li>Network: {NETWORK}</li>
                <li>Votes needed to approve a proposal: {storage? storage.minimum_votes + ' votes' : ''}</li>
                <li>Core Team Multisig: {storage? <TezosAddressLink address={storage.core_team_multisig} /> : ''}</li>
            </ul>
        </section>
    );
}
