import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAcceptablePhotoType,
  isAcceptablePhotoSize,
  photoErrorMessage,
  MAX_PHOTO_UPLOAD_BYTES,
} from "../lib/photo.ts";

test("isAcceptablePhotoType: accepts jpeg/png/webp", () => {
  assert.equal(isAcceptablePhotoType("image/jpeg"), true);
  assert.equal(isAcceptablePhotoType("image/png"), true);
  assert.equal(isAcceptablePhotoType("image/webp"), true);
});

test("isAcceptablePhotoType: rejects gif/svg/heic/empty", () => {
  assert.equal(isAcceptablePhotoType("image/gif"), false);
  assert.equal(isAcceptablePhotoType("image/svg+xml"), false);
  assert.equal(isAcceptablePhotoType("image/heic"), false);
  assert.equal(isAcceptablePhotoType(""), false);
});

test("isAcceptablePhotoSize: 0/negative/oversize rejected", () => {
  assert.equal(isAcceptablePhotoSize(0), false);
  assert.equal(isAcceptablePhotoSize(-1), false);
  assert.equal(isAcceptablePhotoSize(MAX_PHOTO_UPLOAD_BYTES + 1), false);
});

test("isAcceptablePhotoSize: ordinary inputs accepted", () => {
  assert.equal(isAcceptablePhotoSize(1), true);
  assert.equal(isAcceptablePhotoSize(1_500_000), true);
  assert.equal(isAcceptablePhotoSize(MAX_PHOTO_UPLOAD_BYTES), true);
});

test("photoErrorMessage: maps known codes to user copy", () => {
  assert.match(photoErrorMessage(new Error("bad_type")), /JPEG/);
  assert.match(photoErrorMessage(new Error("too_large")), /8MB/);
  assert.match(photoErrorMessage(new Error("decode_failed")), /different file/);
  assert.match(photoErrorMessage(new Error("unknown_thing")), /Couldn/);
  assert.match(photoErrorMessage("not an Error"), /Couldn/);
});
