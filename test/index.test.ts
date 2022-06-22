import { PrismaClient } from "@prisma/client";
import assert from "assert";
import adapterTests from "@feathersjs/adapter-tests";
import errors from "@feathersjs/errors";
import { feathers } from "@feathersjs/feathers";
import { prismaService } from "../src/index";

const prisma = new PrismaClient();

describe("feathers-prisma", () => {
  before(async () => {
    await prisma.user.deleteMany({});
  });

  it("can make queries", async () => {
    const allUsers = await prisma.user.findMany();

    console.log(allUsers);
  });
});

const testSuite = adapterTests([
  ".options",
  ".events",
  "._get",
  "._find",
  "._create",
  "._update",
  "._patch",
  "._remove",
  ".get",
  ".get + $select",
  ".get + id + query",
  ".get + NotFound",
  ".get + id + query id",
  ".find",
  ".find + paginate + query",
  ".remove",
  ".remove + $select",
  ".remove + id + query",
  ".remove + multi",
  ".remove + id + query id",
  ".update",
  ".update + $select",
  ".update + id + query",
  ".update + NotFound",
  ".update + id + query id",
  ".update + query + NotFound",
  ".patch",
  ".patch + $select",
  ".patch + id + query",
  ".patch multiple",
  ".patch multi query same",
  ".patch multi query changed",
  ".patch + query + NotFound",
  ".patch + NotFound",
  ".patch + id + query id",
  ".create",
  ".create + $select",
  ".create multi",
  "internal .find",
  "internal .get",
  "internal .create",
  "internal .update",
  "internal .patch",
  "internal .remove",
  ".find + equal",
  ".find + equal multiple",
  ".find + $sort",
  ".find + $sort + string",
  ".find + $limit",
  ".find + $limit 0",
  ".find + $skip",
  ".find + $select",
  ".find + $or",
  ".find + $in",
  ".find + $nin",
  ".find + $lt",
  ".find + $lte",
  ".find + $gt",
  ".find + $gte",
  ".find + $ne",
  ".find + $gt + $lt + $sort",
  ".find + $or nested + $sort",
  ".find + paginate",
  ".find + paginate + $limit + $skip",
  ".find + paginate + $limit 0",
  ".find + paginate + params",
  "params.adapter + paginate",
  "params.adapter + multi",
]);

describe("Feathers Prisma Service", () => {
  const events = ["testing"];
  const app = feathers().use(
    "/people",
    prismaService({ Model: prisma.user, events } as any)
  );

  it.skip("update with null throws error", async () => {
    debugger;
    try {
      await app.service("people").update(null, {});
      throw new Error("Should never get here");
    } catch (error: any) {
      assert.strictEqual(
        error.message,
        "You can not replace multiple instances. Did you mean 'patch'?"
      );
    }
  });

  testSuite(app, errors, "people");
});
