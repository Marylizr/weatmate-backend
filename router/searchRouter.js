// backend/router/searchRouter.js
const router = require("express").Router();

const authImport = require("../auth/authMiddleware");
const allowRolesImport = require("../auth/allowRoles");
const searchControllerImport = require("../controllers/searchController");

// Normalize exports (handles both: module.exports = fn  OR  module.exports = { fn })
const authMiddleware =
  typeof authImport === "function"
    ? authImport
    : authImport.authMiddleware ||
      authImport.protect ||
      authImport.authenticate;

const allowRoles =
  typeof allowRolesImport === "function"
    ? allowRolesImport
    : allowRolesImport.allowRoles;

const globalSearch =
  typeof searchControllerImport === "function"
    ? searchControllerImport
    : searchControllerImport.globalSearch;

if (typeof authMiddleware !== "function") {
  throw new Error(
    "authMiddleware is not a function. Check ../auth/authMiddleware export."
  );
}
if (typeof allowRoles !== "function") {
  throw new Error(
    "allowRoles is not a function. Check ../auth/roleRules export."
  );
}
if (typeof globalSearch !== "function") {
  throw new Error(
    "globalSearch is not a function. Check ../controllers/searchController export."
  );
}

router.get(
  "/",
  authMiddleware,
  allowRoles("admin", "personal_trainer"),
  globalSearch
);

module.exports = router;
