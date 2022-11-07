import React, { useContext } from 'react';
import { CoreTeamVoteContext } from './context';
import { Button } from './button';
import { TezosAddressLink, IpfsLink } from './links';
import { hexToString } from './utils';


export function Proposals() {
    // Get the required context information
    const { proposals, votes } = useContext(CoreTeamVoteContext);

    // Separate the proposals between accepted, expired and active proposals
    const acceptedProposals = [];
    const expiredProposals = [];
    const activeProposals = [];

    if (proposals && votes) {
        // Loop over the complete list of proposals
        const now = new Date();

        for (const proposal of proposals) {
            // Check if the proposal voting period has finished
            const votingPeriod = parseInt(proposal.value.voting_period);
            const votingEndDate = new Date(proposal.value.timestamp);
            votingEndDate.setDate(votingEndDate.getDate() + votingPeriod);

            if (now > votingEndDate) {
                // Get the total number of votes that the proposal has received
                let totalVotes = 0;
                const proposalVotes = votes[proposal.key];

                for (const option in proposalVotes) {
                    totalVotes += proposalVotes[option];
                }

                // Check if the proposal has been accepted
                if (totalVotes >= parseInt(proposal.value.minimum_votes)) {
                    acceptedProposals.push(proposal);
                } else {
                    expiredProposals.push(proposal);
                }
            } else {
                activeProposals.push(proposal);
            }
        }
    }

    return (
        <>
            <section>
                <h2>Active proposals</h2>
                <ProposalList proposals={activeProposals} active />
            </section>

            <section>
                <h2>Accepted proposals</h2>
                <ProposalList proposals={acceptedProposals} />
            </section>

            <section>
                <h2>Expired proposals</h2>
                <ProposalList proposals={expiredProposals} />
            </section>
        </>
    );
}

function ProposalList(props) {
    return (
        <ul className='proposal-list'>
            {props.proposals.map(proposal =>
                <Proposal key={proposal.key}
                    proposalId={proposal.key}
                    proposal={proposal.value}
                    active={props.active}
                />
            )}
        </ul>
    );
}

function Proposal(props) {
    // Try to extract an ipfs path from the proposal decription
    const proposal = props.proposal;
    const description = hexToString(proposal.description);
    const ipfsPath = description.split('/')[2];

    // Get the voting start and end dates
    const votingStartDate = new Date(proposal.timestamp);
    const votingEndDate = new Date(proposal.timestamp);
    votingEndDate.setDate(votingEndDate.getDate() + parseInt(proposal.voting_period));

    return (
        <li className='proposal'>
            <h3 className='proposal-title'>{hexToString(proposal.title)}</h3>

            <ul className='proposal-description'>
                <li>Proposal #{props.proposalId}</li>
                <li>Description: <IpfsLink path={ipfsPath ? ipfsPath : ''}>IPFS link</IpfsLink></li>
                <li>Issuer: <TezosAddressLink address={proposal.issuer} useAlias shorten /></li>
                <li>Voting started: {votingStartDate.toISOString()}</li>
                <li>Voting end{props.active? 's' : 'ed'}: {votingEndDate.toISOString()}</li>
                <li>Options:
                    <ul className='proposal-options'>
                        {Object.keys(proposal.options).map(key =>
                            <ProposalOption key={key}
                                proposalId={props.proposalId}
                                optionKey={key}
                                optionValue={proposal.options[key]}
                                active={props.active}
                            />
                        )}
                    </ul>
                </li>
            </ul>
        </li>
    );
}

function ProposalOption(props) {
    // Get the required context information
    const { userAddress, multisigStorage, votes, userVotes, voteProposal } = useContext(CoreTeamVoteContext);

    // Check if the connected user is a multisig user
    const isUser = multisigStorage?.users.includes(userAddress);

    // Get the number of votes that received this option
    const proposalVotes = votes && votes[props.proposalId];
    const optionVotes = proposalVotes ? (proposalVotes[props.optionKey] ? proposalVotes[props.optionKey] : 0) : 0;

    // Get the vote class name
    const userVotedOption = userVotes && userVotes[props.proposalId] === props.optionKey;
    const voteClassName = userVotedOption ? 'user-vote' : '';

    return (
        <li className='proposal-option'>
            <Button
                text={hexToString(props.optionValue)}
                className={voteClassName}
                onClick={() => props.active && isUser && voteProposal(props.proposalId, props.optionKey)}
            />
            <p className='proposal-option-votes'>{optionVotes} vote{(optionVotes === 1)? '' : 's'}</p>
        </li>
    );
}
