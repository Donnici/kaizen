import type { AppFeature } from '../enums/app-feature.enum';
import type { RequestUser } from '../types/request-user.type';

export function hasFeature(user: RequestUser, feature: AppFeature): boolean {
    return (user.features as AppFeature[]).includes(feature);
}
