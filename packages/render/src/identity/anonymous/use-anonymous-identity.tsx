import type { AnonymousOpenFramesRequest } from "frames.js/anonymous";
import { useMemo } from "react";
import type {
  SignerStateActionContext,
  SignerStateInstance,
  SignFrameActionFunction,
} from "../../types";

// we don't use Record<string, never> here as it is hard to satisfy
// Record<string, unknown> is good enough we actually don't care about the values here
// as we don't use the at all
export type AnonymousSigner = Record<string, unknown>;

export type AnonymousFrameContext = Record<string, unknown>;

export type AnonymousSignerInstance = SignerStateInstance<
  AnonymousSigner,
  AnonymousOpenFramesRequest,
  AnonymousFrameContext
>;

const onSignerlessFramePress = (): Promise<void> => Promise.resolve();
const logout = (): Promise<void> => Promise.resolve();
const signer: AnonymousSigner = {};
const signFrameAction: SignFrameActionFunction<
  SignerStateActionContext<AnonymousSigner, AnonymousFrameContext>,
  AnonymousOpenFramesRequest
> = (actionContext) => {
  const searchParams = new URLSearchParams({
    postType:
      actionContext.type === "tx-post"
        ? "post"
        : actionContext.frameButton.action,
    postUrl: actionContext.target ?? "",
    specification: "openframes",
  });

  return Promise.resolve({
    body: {
      untrustedData: {
        buttonIndex: actionContext.buttonIndex,
        state: actionContext.state,
        url: actionContext.url,
        inputText: actionContext.inputText,
        address:
          actionContext.type === "tx-data" || actionContext.type === "tx-post"
            ? actionContext.address
            : undefined,
        transactionId:
          actionContext.type === "tx-post"
            ? actionContext.transactionId
            : undefined,
        unixTimestamp: Date.now(),
      },
      clientProtocol: "anonymous@1.0",
    },
    searchParams,
  });
};

export function useAnonymousIdentity(): AnonymousSignerInstance {
  return useMemo(() => {
    return {
      specification: "openframes",
      hasSigner: true,
      onSignerlessFramePress,
      signer,
      isLoadingSigner: false,
      logout,
      signFrameAction,
      withContext(frameContext) {
        return {
          signerState: this,
          frameContext,
        };
      },
    };
  }, []);
}
