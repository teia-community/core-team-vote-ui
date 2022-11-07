import React, { createContext } from 'react';
import { TezosToolkit, MichelsonMap } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { NETWORK, CONTRACT_ADDRESS, RPC_NODE } from '../constants';
import { InformationMessage, ConfirmationMessage, ErrorMessage } from './messages';
import * as utils from './utils';


// Initialize the tezos toolkit
const tezos = new TezosToolkit(RPC_NODE);

// Initialize the wallet
const wallet = new BeaconWallet({
    name: 'Core Team Vote',
    preferredNetwork: NETWORK
});

// Pass the wallet to the tezos toolkit
tezos.setWalletProvider(wallet);

// Create the core team vote context
export const CoreTeamVoteContext = createContext();

// Create the core team vote context provider component
export class CoreTeamVoteContextProvider extends React.Component {

    constructor(props) {
        // Pass the properties to the base class
        super(props);

        // Define the component state parameters
        this.state = {
            // The user address
            userAddress: undefined,

            // The core team vote contract address
            contractAddress: CONTRACT_ADDRESS,

            // The core team vote contract storage
            storage: undefined,

            // The core team multisig contract storage
            multisigStorage: undefined,

            // The multisig user aliases
            userAliases: undefined,

            // The multi-option proposals
            proposals: undefined,

            // The votes
            votes: undefined,

            // The user votes
            userVotes: undefined,

            // The core team vote contract reference
            contract: undefined,

            // The information message
            informationMessage: undefined,

            // The confirmation message
            confirmationMessage: undefined,

            // The error message
            errorMessage: undefined,

            // Sets the information message
            setInformationMessage: (message) => this.setState({
                informationMessage: message
            }),

            // Sets the confirmation message
            setConfirmationMessage: (message) => this.setState({
                confirmationMessage: message
            }),

            // Sets the error message
            setErrorMessage: (message) => this.setState({
                errorMessage: message
            }),

            // Returns the core team vote contract reference
            getContract: async () => {
                if (this.state.contract) {
                    return this.state.contract;
                }

                console.log('Accessing the core team vote contract...');
                const contract = await utils.getContract(tezos, this.state.contractAddress);
                this.setState({ contract: contract });

                return contract;
            },

            // Connects the user wallet
            connectWallet: async () => {
                console.log('Connecting the user wallet...');
                await wallet.requestPermissions({ network: { type: NETWORK, rpcUrl: RPC_NODE } })
                    .catch(error => console.log('Error while requesting wallet permissions:', error));

                console.log('Accessing the user address...');
                const userAddress = await utils.getUserAddress(wallet);
                this.setState({ userAddress: userAddress });

                if (this.state.storage && userAddress) {
                    console.log('Downloading the user votes...');
                    const userVotes = await utils.getUserVotes(userAddress, this.state.storage.votes);
                    this.setState({ userVotes: userVotes });
                }
            },

            // Disconnects the user wallet
            disconnectWallet: async () => {
                // Clear the active account
                console.log('Disconnecting the user wallet...');
                await wallet.clearActiveAccount();

                // Reset the user related state parameters
                this.setState({
                    userAddress: undefined,
                    userVotes: undefined,
                    contract: undefined
                });
            },

            // Waits for an operation to be confirmed
            confirmOperation: async (operation) => {
                // Return if the operation is undefined
                if (operation === undefined) return;

                // Display the information message
                this.state.setInformationMessage('Waiting for the operation to be confirmed...');

                // Wait for the operation to be confirmed
                console.log('Waiting for the operation to be confirmed...');
                await operation.confirmation(1)
                    .then(() => console.log(`Operation confirmed: https://${NETWORK}.tzkt.io/${operation.opHash}`))
                    .catch(error => console.log('Error while confirming the operation:', error));

                // Remove the information message
                this.state.setInformationMessage(undefined);
            },

            // Creates a multi-option proposal
            createProposal: async (title, ipfsPath, options, votingPeriod) => {
                // Check that the title is not undefined
                if (!title) {
                    this.state.setErrorMessage('The proposal title is not defined');
                    return;
                }

                // Check that the IPFS path is not undefined
                if (!ipfsPath) {
                    this.state.setErrorMessage('The text proposal needs to be uploaded first to IPFS');
                    return;
                }

                // Clean the options from duplicates and create the options dictionary
                const cleanOptions = new Set(options);
                const optionsDictionary = {};
                let counter = 0;

                for (const option of cleanOptions) {
                    optionsDictionary[counter] = utils.stringToHex(option);
                    counter += 1;
                }

                // Get the core team vote contract reference
                const contract = await this.state.getContract();

                // Return if the contract reference is not available
                if (!contract) return;

                // Send the create proposal operation
                console.log('Sending the create proposal operation...');
                const operation = await contract.methods.create_proposal(
                    utils.stringToHex(title),
                    utils.stringToHex('ipfs://' + ipfsPath),
                    MichelsonMap.fromLiteral(optionsDictionary),
                    votingPeriod).send()
                    .catch(error => console.log('Error while sending the create proposal operation:', error));

                // Wait for the confirmation
                await this.state.confirmOperation(operation);

                // Update the proposals
                const proposals = await utils.getBigmapKeys(this.state.storage.proposals);
                this.setState({ proposals: proposals });
            },

            // Votes a proposal
            voteProposal: async (proposalId, option) => {
                // Get the core team vote contract reference
                const contract = await this.state.getContract();

                // Return if the contract reference is not available
                if (!contract) return;

                // Send the vote proposal operation
                console.log('Sending the vote proposal operation...');
                const operation = await contract.methods.vote_proposal(proposalId, option).send()
                    .catch(error => console.log('Error while sending the vote proposal operation:', error));

                // Wait for the confirmation
                await this.state.confirmOperation(operation);

                // Update the votes and the user votes
                const storage = this.state.storage;
                const votes = await utils.getVotes(storage.votes);
                const userVotes = await utils.getUserVotes(this.state.userAddress, storage.votes);
                this.setState({
                    votes: votes,
                    userVotes: userVotes
                });
            },

            // Uploads a file to ipfs and returns the ipfs path
            uploadFileToIpfs: async (file, displayUploadInformation) => {
                // Check that the file is not undefined
                if (!file) {
                    this.state.setErrorMessage('A file needs to be loaded before uploading to IPFS');
                    return;
                }

                // Display the information message
                if (displayUploadInformation) this.state.setInformationMessage(`Uploading ${file.name} to ipfs...`);

                // Upload the file to IPFS
                console.log(`Uploading ${file.name} to ipfs...`);
                const added = await utils.uploadFileToIPFSProxy(file)
                    .catch(error => console.log(`Error while uploading ${file.name} to ipfs:`, error));

                // Remove the information message
                if (displayUploadInformation) this.state.setInformationMessage(undefined);

                // Return the IPFS path
                return added?.data.cid;
            }
        };

        // Loads all the needed information at once
        this.loadInformation = async () => {
            // Initialize the new state dictionary
            const newState = {}

            console.log('Accessing the user address...');
            const userAddress = await utils.getUserAddress(wallet);
            newState.userAddress = userAddress;

            console.log('Downloading the core team vote contract storage...');
            const storage = await utils.getContractStorage(this.state.contractAddress);
            newState.storage = storage;

            if (storage) {
                console.log('Downloading the core team multisig contract storage...');
                const multisigStorage = await utils.getContractStorage(storage.core_team_multisig);
                newState.multisigStorage = multisigStorage;

                if (multisigStorage) {
                    console.log('Downloading the core team multisig user aliases...');
                    const userAliases = await utils.getUserAliases(multisigStorage.users);
                    newState.userAliases = userAliases;
                }

                console.log('Downloading the multi-option proposals...');
                const proposals = await utils.getBigmapKeys(storage.proposals);
                newState.proposals = proposals;

                console.log('Downloading the votes...');
                const votes = await utils.getVotes(storage.votes);
                newState.votes = votes;

                if (userAddress) {
                    console.log('Downloading the user votes...');
                    const userVotes = await utils.getUserVotes(userAddress, storage.votes);
                    newState.userVotes = userVotes;
                }
            }

            // Update the component state
            this.setState(newState);
        };
    }

    componentDidMount() {
        // Load all the relevant information
        this.loadInformation();
    }

    render() {
        return (
            <CoreTeamVoteContext.Provider value={this.state}>
                {this.state.informationMessage &&
                    <InformationMessage message={this.state.informationMessage} />
                }

                {this.state.confirmationMessage &&
                    <ConfirmationMessage message={this.state.confirmationMessage} onClick={() => this.state.setConfirmationMessage(undefined)} />
                }

                {this.state.errorMessage &&
                    <ErrorMessage message={this.state.errorMessage} onClick={() => this.state.setErrorMessage(undefined)} />
                }

                {this.props.children}
            </CoreTeamVoteContext.Provider>
        );
    }
}
