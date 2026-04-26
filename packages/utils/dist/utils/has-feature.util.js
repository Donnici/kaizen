"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasFeature = hasFeature;
function hasFeature(user, feature) {
    return user.features.includes(feature);
}
