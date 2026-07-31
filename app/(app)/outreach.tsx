import React from 'react';

import { ComingSoon } from '@/ui/ComingSoon';

export default function OutreachScreen() {
  return (
    <ComingSoon
      testID="outreach-screen"
      icon="📣"
      title="Outreach"
      summary="Bring past customers back with a text they actually read."
      bullets={[
        'Send a campaign to a group of past customers at once',
        'Target by what they bought, or how long since they last did',
        'Replies land back in Conversations as normal threads',
        'Opt-outs are handled automatically, so campaigns stay compliant',
      ]}
    />
  );
}
