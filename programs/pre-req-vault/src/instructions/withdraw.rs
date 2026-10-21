
use crate::state::VaultState;

use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

declare_program!(registration);

use registration::cpi::{accounts::Initialize, initialize};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    /// CHECK: Initialized by the registration program through CPI.
    #[account(
        mut,
        seeds = [b"prereqs", user.key().as_ref()],
        seeds::program = application_program.key(),
        bump,
    )]
    pub application_account: UncheckedAccount<'info>,

    pub application_program: Program<'info, registration::program::Q3PreReqsRs>,

    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        // 1. Transfer SOL from the vault PDA back to the user.
        let cpi_program = self.system_program.key();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        let vault_key = self.vault_state.key();
        let bump = [self.vault_state.vault_bump];

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault",
            vault_key.as_ref(),
            &bump,
        ]];

        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer_seeds,
        );

        transfer(cpi_ctx, amount)?;

        // 2. Call the registration program through CPI.
        let cpi_program = self.application_program.key();

        let cpi_accounts = Initialize {
            user: self.user.to_account_info(),
            account: self.application_account.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            cpi_program,
            cpi_accounts,
        );

        let github_username = "Torqued-codes".to_string();

        initialize(cpi_ctx, github_username)?;

        Ok(())
    }
}
