import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { PreReqVault } from "../target/types/pre_req_vault";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { expect } from "chai";

describe("pre-req-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.preReqVault as Program<PreReqVault>;
  const user = provider.wallet.publicKey;

  const [vaultStatePda, stateBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("state"), user.toBuffer()],
      program.programId,
    );

  const [vaultPda, vaultBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId,
    );

  it("Initialize the vault", async () => {
    const tx = await program.methods
      .initialize()
      .accountsStrict({
        user,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction:", tx);

    const vaultState =
      await program.account.vaultState.fetch(vaultStatePda);

    expect(vaultState.vaultBump).to.equal(vaultBump);
    expect(vaultState.stateBump).to.equal(stateBump);
  });

  it("Deposit 1 SOL into the vault", async () => {
    const depositAmount = LAMPORTS_PER_SOL;

    const initialVaultBalance =
      await provider.connection.getBalance(vaultPda);
    const initialUserBalance =
      await provider.connection.getBalance(user);

    const tx = await program.methods
      .deposit(new BN(depositAmount))
      .accountsStrict({
        user,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit transaction:", tx);

    const finalVaultBalance =
      await provider.connection.getBalance(vaultPda);
    const finalUserBalance =
      await provider.connection.getBalance(user);

    expect(finalVaultBalance).to.equal(
      initialVaultBalance + depositAmount,
    );
    expect(finalUserBalance).to.be.lessThan(
      initialUserBalance - depositAmount,
    );
  });

  it("Withdraw 0.5 SOL and register the user", async () => {
    const withdrawAmount = 0.5 * LAMPORTS_PER_SOL;

    const initialVaultBalance =
      await provider.connection.getBalance(vaultPda);
    const initialUserBalance =
      await provider.connection.getBalance(user);

    const applicationProgram = new PublicKey(
      "TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM",
    );

    const [applicationAccount] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("prereqs"), user.toBuffer()],
        applicationProgram,
      );

    const tx = await program.methods
      .withdraw(new BN(withdrawAmount))
      .accountsStrict({
        user,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
        applicationAccount,
        applicationProgram,
      })
      .rpc();

    console.log("Withdraw and registration transaction:", tx);

    const finalVaultBalance =
      await provider.connection.getBalance(vaultPda);
    const finalUserBalance =
      await provider.connection.getBalance(user);

    expect(finalVaultBalance).to.equal(
      initialVaultBalance - withdrawAmount,
    );
    expect(finalUserBalance).to.be.greaterThan(initialUserBalance);
  });

  it("Close the vault and withdraw the remaining funds", async () => {
    const initialUserBalance =
      await provider.connection.getBalance(user);

    const tx = await program.methods
      .close()
      .accountsStrict({
        user,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Close transaction:", tx);

    const finalVaultBalance =
      await provider.connection.getBalance(vaultPda);

    expect(finalVaultBalance).to.equal(0);

    const vaultStateInfo =
      await provider.connection.getAccountInfo(vaultStatePda);

    expect(vaultStateInfo).to.be.null;

    const finalUserBalance =
      await provider.connection.getBalance(user);

    expect(finalUserBalance).to.be.greaterThan(initialUserBalance);
  });
});

