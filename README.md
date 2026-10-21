# Solana Vault Program

A Solana Anchor program that allows users to initialize a vault, deposit SOL, withdraw funds, and close the vault. The program also integrates with the Turbin3 registration program through a Cross-Program Invocation (CPI) during withdrawal.

## Architecture Diagram

The diagram below illustrates the Vault program's instructions, important accounts, SOL transfers, and registration CPI flow.

<img width="1112" height="743" alt="image" src="https://github.com/user-attachments/assets/c3c6638b-86a2-44b9-bd1a-71e413e0336c" />

## Implemented Features

- **Vault Initialization:** Creates the vault state and vault accounts using Program Derived Addresses (PDAs).
- **SOL Deposits:** Allows users to deposit SOL into their vault.
- **SOL Withdrawals:** Transfers the requested amount of SOL from the vault back to the user.
- **Registration CPI:** During withdrawal, the Vault program invokes the registration program to register the GitHub username `Torqued-codes`.
- **Vault Closure:** Returns the remaining vault funds to the user and closes the vault state account.

## Instructions

| Instruction | Description |
|---|---|
| `initialize()` | Initializes the vault and its state. |
| `deposit(amount)` | Deposits SOL into the vault. |
| `withdraw(amount)` | Withdraws SOL and invokes the registration program through CPI. |
| `close()` | Returns the remaining funds and closes the vault state account. |

## Important Accounts

- **User:** The wallet that signs and authorizes transactions.
- **VaultState PDA:** Stores the vault's state and bump values. Derived using the seeds `["state", user]`.
- **Vault PDA:** Holds the deposited SOL. Derived using the seeds `["vault", vault_state]`.
- **Registration PDA:** The registration program's account, derived using the seeds `["prereqs", user]`.
- **System Program:** Supports SOL transfers and account creation.

## Registration CPI Flow

When a user invokes `withdraw()`:

1. The Vault program transfers the requested SOL to the user.
2. It invokes the registration program using CPI.
3. The registration program initializes the user's registration account with the supplied GitHub username.

This integration demonstrates how one Solana program can invoke another program within a transaction.

## Testing

The program was tested on Solana Devnet. The test suite successfully completed all four operations:

- Vault initialization
- Deposit of 1 SOL
- Withdrawal of 0.5 SOL with registration CPI
- Vault closure and return of remaining funds

## Deployment

**Network:** Solana Devnet

**Program ID:** `9V6nwcTA5cm5XJKT27nAmrXA5U7sabr2rbPJkkvop4iM`

[View the deployed program on Solana Explorer](https://explorer.solana.com/address/9V6nwcTA5cm5XJKT27nAmrXA5U7sabr2rbPJkkvop4iM?cluster=devnet)





