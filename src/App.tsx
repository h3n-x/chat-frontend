import React, { useEffect, useState } from 'react';
import { isWebCryptoSupported } from './crypto/webcrypto';
import { useCryptoChat } from './hooks/useCryptoChat';
import { FailClosedBanner } from './components/FailClosedBanner';
import { RoomJoin } from './components/RoomJoin';
import { ChatRoom } from './components/ChatRoom';
import { DecoyRoom } from './components/DecoyRoom';

export const App: React.FC = () => {
  const [cryptoSupported, setCryptoSupported] = useState<boolean>(true);
  const [isDuressActive, setIsDuressActive] = useState<boolean>(false);

  const {
    roomId,
    roomKeyBase64,
    fingerprint,
    participantCount,
    status,
    socketError,
    isHandshaking,
    identity,
    messages,
    isSasVerified,
    isSasModalOpen,
    isPeerTyping,
    confirmSasMatch,
    rejectSasMatch,
    openSasModal,
    createRoom,
    joinWithKey,
    joinWithCodeOnly,
    sendMessage,
    sendTypingSignal,
    sendEncryptedFile,
    sendEncryptedAudio,
    loadAndDecryptMedia,
    downloadAndDecryptFile,
    purgeMessage,
    leaveRoom,
    nukeRoom,
    remoteNukeRoom,
    isDecoyTrafficActive,
    toggleDecoyTraffic,
    rttMs,
    sendReaction,
    burnViewOnceMessage,
    sendEncryptedStegoImage,
  } = useCryptoChat();

  // Check WebCrypto support on initial mount
  useEffect(() => {
    if (!isWebCryptoSupported()) {
      setCryptoSupported(false);
      return;
    }

    // Parse URL hash for instant zero-knowledge join (Method A)
    // URL format: /#room=XYZ&key=base64_256bit
    const parseHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;

      const params = new URLSearchParams(hash);
      const urlRoom = params.get('room');
      const urlKey = params.get('key');

      if (urlRoom && urlKey) {
        joinWithKey(urlRoom, decodeURIComponent(urlKey)).catch((err) => {
          console.error('Failed to auto-join from URL hash:', err);
        });
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [joinWithKey]);

  const handleTriggerDuress = () => {
    if (roomId) {
      nukeRoom();
    }
    setIsDuressActive(true);
  };

  // Fail-Closed: halt execution completely if WebCrypto is unavailable
  if (!cryptoSupported) {
    return <FailClosedBanner />;
  }

  if (isDuressActive) {
    return <DecoyRoom onExitDecoy={() => setIsDuressActive(false)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center">
      {!roomId ? (
        <RoomJoin
          onCreateRoom={async () => {
            await createRoom();
          }}
          onJoinByCode={async (code) => {
            await joinWithCodeOnly(code);
          }}
          onJoinWithKey={joinWithKey}
          onDuress={handleTriggerDuress}
        />
      ) : (
        <ChatRoom
          roomId={roomId}
          roomKeyBase64={roomKeyBase64}
          fingerprint={fingerprint}
          participantCount={participantCount}
          status={status}
          socketError={socketError}
          isHandshaking={isHandshaking}
          isSasVerified={isSasVerified}
          isSasModalOpen={isSasModalOpen}
          isPeerTyping={isPeerTyping}
          identity={identity}
          messages={messages}
          onSendMessage={sendMessage}
          onSendFile={sendEncryptedFile}
          onSendAudio={sendEncryptedAudio}
          onDownloadFile={downloadAndDecryptFile}
          onLoadMedia={loadAndDecryptMedia}
          onPurgeMessage={purgeMessage}
          onTyping={sendTypingSignal}
          onToggleDecoyTraffic={toggleDecoyTraffic}
          isDecoyTrafficActive={isDecoyTrafficActive}
          rttMs={rttMs}
          onReact={sendReaction}
          onBurnViewOnce={burnViewOnceMessage}
          onSendStegoImage={sendEncryptedStegoImage}
          onDuress={handleTriggerDuress}
          onLeave={leaveRoom}
          onNuke={nukeRoom}
          onRemoteNuke={remoteNukeRoom}
          onConfirmSasMatch={confirmSasMatch}
          onRejectSasMatch={rejectSasMatch}
          onOpenSasModal={openSasModal}
        />
      )}
    </div>
  );
};

export default App;
