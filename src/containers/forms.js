import React, { useContext, useState } from 'react';
import { CoreTeamVoteContext } from './context';
import { Button } from './button';
import { IpfsLink } from './links';


export function CreateProposalForms() {
    // Get the core team vote context
    const context = useContext(CoreTeamVoteContext);

    // Return if the user is not connected
    if (!context.userAddress) {
        return (
            <section>
                <p>You need to sync your wallet to be able to create proposals.</p>
            </section>
        );
    }

    // Return if the user is not one of the multisig users
    if (!context.multisigStorage?.users.includes(context.userAddress)) {
        return (
            <section>
                <p>Only core team users can create new proposals.</p>
            </section>
        );
    }

    return (
        <section>
            <h2>Multi-option proposal</h2>
            <MultiOptionProposalForm
                uploadFileToIpfs={context.uploadFileToIpfs}
                handleSubmit={context.createProposal}
            />
        </section>
    );
}

function MultiOptionProposalForm(props) {
    // Set the component state
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(undefined);
    const [ipfsPath, setIpfsPath] = useState(undefined);
    const [options, setOptions] = useState(["yes", "no", "abstain"]);
    const [votingPeriod, setVotingPeriod] = useState(2);

    // Define the file form on change handler
    const handleFileChange = e => {
        setFile(e.target.files[0]);
        setIpfsPath(undefined);
    };

    // Define the file form on click handler
    const handleFileClick = async e => {
        e.preventDefault();

        // Update the component state
        setIpfsPath(await props.uploadFileToIpfs(file, true));
    };

    // Define the options form on change handler
    const handleOptionsChange = (index, value) => {
        // Create a new options array
        const newOptions = options.map((option, i) => (i === index) ? value : option);

        // Update the component state
        setOptions(newOptions);
    };

    // Define the options form on click handler
    const handleOptionsClick = (e, increase) => {
        e.preventDefault();

        // Create a new options array
        const newOptions = options.slice();

        // Add or remove an option from the list
        if (increase) {
            newOptions.push("");
        } else if (newOptions.length > 2) {
            delete newOptions.pop();
        }

        // Update the component state
        setOptions(newOptions);
    };

    // Define the on submit handler
    const handleSubmit = e => {
        e.preventDefault();
        props.handleSubmit(title, ipfsPath, options, votingPeriod);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='form-input'>
                <label>Short title:
                    {' '}
                    <input
                        type='text'
                        spellCheck='false'
                        minLength='1'
                        value={props.title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </label>
                <br />
                <label>File with the proposal description:
                    {' '}
                    <input
                        type='file'
                        onChange={handleFileChange}
                    />
                </label>
                {file &&
                    <div>
                        <Button text={ipfsPath ? 'uploaded' : 'upload to IPFS'} onClick={handleFileClick} />
                        {' '}
                        {ipfsPath &&
                            <IpfsLink path={ipfsPath} />
                        }
                    </div>
                }
                <br />
                <label className='options-input'>Voting options:
                    <div className='options-input-container'>
                        {options.map((option, index) => (
                            <label key={index} className='option-input'>
                                <input 
                                    type='text'
                                    spellCheck='false'
                                    minLength='1'
                                    value={option}
                                    onChange={e => handleOptionsChange(index, e.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                    <Button text='+' onClick={e => handleOptionsClick(e, true)} />
                    {' '}
                    <Button text='-' onClick={e => handleOptionsClick(e, false)} />
                </label>
                <br />
                <label>Voting period (days):
                    {' '}
                    <input
                        type='number'
                        min='2'
                        step='1'
                        value={votingPeriod}
                        onChange={e => setVotingPeriod(Math.round(e.target.value))}
                    />
                </label>
            </div>
            <input type='submit' value='send proposal' />
        </form>
    );
}
