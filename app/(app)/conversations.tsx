import React from 'react';

import { ComingSoon } from '@/ui/ComingSoon';

export default function ConversationsScreen() {
  return (
    <ComingSoon
      testID="conversations-screen"
      icon="💬"
      title="Conversations"
      summary="Every text thread with your customers, in one place."
      bullets={[
        'One inbox for every customer texting your Catch number',
        'Reply from your phone without handing out your personal number',
        'Threads carry the whole history, so anyone picking one up has context',
        'Quick replies for the questions you answer twenty times a week',
      ]}
    />
  );
}
