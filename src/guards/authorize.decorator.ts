import { SetMetadata } from '@nestjs/common';

import type { PolicyResource } from '../enums/policy-resource.enum';
import type { StageAction } from '../enums/stage-action.enum';

export const AUTHORIZATION_RULE_KEY = 'authorization-rule';

export type AuthorizationRule = {
  action: StageAction;
  resource: PolicyResource;
};

export const Authorize = (resource: PolicyResource, action: StageAction) =>
  SetMetadata(AUTHORIZATION_RULE_KEY, {
    action,
    resource,
  } satisfies AuthorizationRule);
