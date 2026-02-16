import { MetaMaskLogo } from "./MetaMaskLogo";
import { MetaMaskFlaskLogo } from "./MetaMaskFlaskLogo";
import type { MetamaskState } from "./MetamaskContext";
import type { Snap } from "./types";
import { isLocalSnap } from "./utils/snap";
import { Button } from "@heroui/react";

export const shouldDisplayReconnectButton = (installedSnap?: Snap) => installedSnap && isLocalSnap(installedSnap?.id);

export const InstallButton = () => (
  <Button onClick={() => (window.location.href = "https://metamask.io/")}>
    <MetaMaskLogo />
    Install MetaMask
  </Button>
);

export const ConnectButton = (props: any) => {
  return (
    <Button onClick={props.onClick}>
      {props.isFlask ? <MetaMaskFlaskLogo /> : <MetaMaskLogo />}
      Connect
    </Button>
  );
};

export const ReconnectButton = (props: any) => {
  return (
    <Button onClick={props.onClick}>
      <MetaMaskFlaskLogo />
      Reconnect
    </Button>
  );
};

export const HeaderButtons = ({ 
  state, 
  onConnectClick, 
  isAppConnected 
}: { 
  state: MetamaskState; 
  onConnectClick(): unknown;
  isAppConnected?: boolean;
}) => {
  // If app is not connected, always show Connect button (even if snap is installed)
  if (!isAppConnected) {
    if (!state.snapsDetected && !state.installedSnap) {
      return <InstallButton />;
    }
    
    if (shouldDisplayReconnectButton(state.installedSnap)) {
      return <ReconnectButton onClick={onConnectClick} />;
    }
    
    return <ConnectButton onClick={onConnectClick} isFlask={state.isFlask} />;
  }

  // If app is connected, show Connected state
  if (!state.snapsDetected && !state.installedSnap) {
    return <InstallButton />;
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} isFlask={state.isFlask} />;
  }

  if (shouldDisplayReconnectButton(state.installedSnap)) {
    return <ReconnectButton onClick={onConnectClick} />;
  }

  return (
    <Button disabled>
      <MetaMaskLogo /> Connected
    </Button>
  );
};
