import type { AppFeature } from '../enums/app-feature.enum';
import type { RequestUser } from '../types/request-user.type';
export declare function hasFeature(user: RequestUser, feature: AppFeature): boolean;
