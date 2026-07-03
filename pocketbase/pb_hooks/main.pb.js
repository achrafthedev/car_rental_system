/// <reference path="../pb_data/types.d.ts" />

// ---------------------------------------------------------------------------
// Autodrive bootstrap: idempotently provisions collections on first boot so
// `docker compose up` works with zero manual setup. Safe to run on every
// restart -- it no-ops once collections/fields already exist.
//
// This mirrors pocketbase/pb_schema.json (the human-readable/importable
// reference copy -- paste it into Settings > Import collections if you ever
// need to re-seed manually). It's inlined here rather than read from disk at
// runtime because the JSVM sandbox doesn't expose a general file-read API.
// ---------------------------------------------------------------------------
onBootstrap((e) => {
  e.next();

  /** @type {Array<any>} */
  const definitions = [
    {
      id: "eb20bf44000fb9b", name: "users", type: "auth",
      listRule: 'id = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'id = @request.auth.id || @request.auth.role = "admin"',
      createRule: "",
      updateRule: '(id = @request.auth.id && @request.body.role:isset = false) || @request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "name", type: "text", required: true, min: 1, max: 120 },
        { name: "role", type: "select", required: true, maxSelect: 1, values: ["admin", "operator", "customer"] },
      ],
    },
    {
      id: "0762bf3b80559f5", name: "vehicles", type: "base",
      listRule: "", viewRule: "",
      createRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "plate_number", type: "text", required: true, unique: true, min: 3, max: 20 },
        { name: "make", type: "text", required: true, min: 1, max: 60 },
        { name: "model", type: "text", required: true, min: 1, max: 60 },
        { name: "year", type: "number", required: true, min: 1900 },
        { name: "color", type: "text", max: 40 },
        { name: "vin", type: "text", unique: true, max: 32 },
        { name: "fuel_type", type: "select", required: true, maxSelect: 1, values: ["petrol", "diesel", "electric", "hybrid"] },
        { name: "gearbox", type: "select", required: true, maxSelect: 1, values: ["manual", "automatic"] },
        { name: "daily_rate", type: "number", required: true, min: 0.01 },
        { name: "mileage", type: "number", required: true, min: 0 },
        { name: "doors", type: "number", min: 2, max: 6 },
        { name: "passengers", type: "number", min: 1, max: 15 },
        { name: "rating", type: "number", min: 0, max: 5 },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["available", "rented", "maintenance", "out_of_service"] },
        { name: "location", type: "text", required: true, min: 1, max: 120 },
        { name: "images", type: "file", maxSelect: 10, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"], thumbs: ["100x100", "400x300"] },
        { name: "telemetry", type: "json", maxSize: 200000 },
      ],
    },
    {
      id: "cdd304590266fd1", name: "customers", type: "base",
      listRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || user = @request.auth.id',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || user = @request.auth.id',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || user = @request.auth.id',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "user", type: "relation", relationTo: "users", maxSelect: 1, displayFields: ["name", "email"] },
        { name: "first_name", type: "text", required: true, min: 1, max: 60 },
        { name: "last_name", type: "text", required: true, min: 1, max: 60 },
        { name: "email", type: "email", required: true, unique: true },
        { name: "phone", type: "text", required: true, min: 5, max: 30 },
        { name: "license_number", type: "text", required: true, min: 1, max: 60 },
        { name: "license_expiry", type: "date", required: true },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["active", "blacklisted"] },
        { name: "kyc_verified", type: "bool" },
        { name: "notes", type: "text", max: 2000 },
        { name: "license_photo", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg"], protected: true },
        { name: "selfie_photo", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg"], protected: true },
      ],
    },
    {
      id: "99ecffaf74057c2", name: "bookings", type: "base",
      listRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || customer.user = @request.auth.id',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || customer.user = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "operator" || customer.user = @request.auth.id',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "vehicle", type: "relation", required: true, relationTo: "vehicles", minSelect: 1, maxSelect: 1, displayFields: ["plate_number", "make", "model"] },
        { name: "customer", type: "relation", required: true, relationTo: "customers", minSelect: 1, maxSelect: 1, displayFields: ["first_name", "last_name"] },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["draft", "confirmed", "active", "completed", "cancelled"] },
        { name: "pickup_datetime", type: "date", required: true },
        { name: "return_datetime", type: "date", required: true },
        { name: "pickup_mileage", type: "number", min: 0 },
        { name: "return_mileage", type: "number", min: 0 },
        { name: "pickup_fuel_level", type: "number", min: 0, max: 100 },
        { name: "return_fuel_level", type: "number", min: 0, max: 100 },
        { name: "total_price", type: "number", required: true, min: 0 },
        { name: "stripe_payment_intent", type: "text", max: 120 },
        { name: "signature", type: "file", maxSelect: 1, maxSize: 2097152, mimeTypes: ["image/png", "image/jpeg", "image/svg+xml"] },
      ],
    },
    {
      id: "5800f6851b4ff21", name: "damages", type: "base",
      listRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "vehicle", type: "relation", required: true, relationTo: "vehicles", minSelect: 1, maxSelect: 1, displayFields: ["plate_number"], cascadeDelete: true },
        { name: "booking", type: "relation", relationTo: "bookings", maxSelect: 1 },
        { name: "part", type: "text", required: true, min: 1, max: 60 },
        { name: "view", type: "select", required: true, maxSelect: 1, values: ["top", "side", "front", "back"] },
        { name: "severity", type: "select", required: true, maxSelect: 1, values: ["light", "moderate", "severe"] },
        { name: "description", type: "text", required: true, min: 1, max: 2000 },
        { name: "photos", type: "file", maxSelect: 5, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"], thumbs: ["200x200"] },
        { name: "resolved", type: "bool" },
        { name: "x_percent", type: "number", required: true, min: 0, max: 100 },
        { name: "y_percent", type: "number", required: true, min: 0, max: 100 },
      ],
    },
    {
      id: "b2ab818effe3363", name: "expenses", type: "base",
      listRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "operator"',
      deleteRule: '@request.auth.role = "admin"',
      schema: [
        { name: "vehicle", type: "relation", required: true, relationTo: "vehicles", minSelect: 1, maxSelect: 1, displayFields: ["plate_number"], cascadeDelete: true },
        { name: "type", type: "select", required: true, maxSelect: 1, values: ["fuel", "maintenance", "insurance", "cleaning", "toll", "other"] },
        { name: "amount", type: "number", required: true, min: 0 },
        { name: "date", type: "date", required: true },
        { name: "description", type: "text", max: 2000 },
        { name: "receipt", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "application/pdf"] },
      ],
    },
  ];

  // Pass 1: create every collection shell (skip "users" -- it's a system
  // auth collection already provisioned by PocketBase).
  for (const def of definitions) {
    if (def.name === "users") continue;

    let collection;
    try {
      collection = $app.findCollectionByNameOrId(def.name);
    } catch (_) {
      collection = null;
    }
    if (collection) continue;

    // Rules are intentionally omitted here and applied in pass 2 -- some
    // rules reference fields (e.g. "user") that don't exist until then.
    collection = new Collection({
      id: def.id,
      name: def.name,
      type: def.type,
    });
    $app.save(collection);
  }

  // Pass 2: merge in fields now that every collection (and thus every
  // relation target) exists, then apply the final API rules.
  for (const def of definitions) {
    const collection = $app.findCollectionByNameOrId(def.name);
    const existingFieldNames = collection.fields.map((f) => f.name);

    for (const field of def.schema) {
      if (existingFieldNames.includes(field.name)) continue;

      const fieldConfig = Object.assign({}, field);
      if (fieldConfig.relationTo) {
        fieldConfig.collectionId = $app.findCollectionByNameOrId(fieldConfig.relationTo).id;
        delete fieldConfig.relationTo;
      }
      collection.fields.add(new Field(fieldConfig));
    }

    // "base" collections don't get created/updated fields automatically --
    // add them so `sort: "-created"` works the way every list page expects.
    if (def.type === "base") {
      if (!existingFieldNames.includes("created")) {
        collection.fields.add(new Field({ name: "created", type: "autodate", onCreate: true, onUpdate: false }));
      }
      if (!existingFieldNames.includes("updated")) {
        collection.fields.add(new Field({ name: "updated", type: "autodate", onCreate: true, onUpdate: true }));
      }
    }

    collection.listRule = def.listRule;
    collection.viewRule = def.viewRule;
    collection.createRule = def.createRule;
    collection.updateRule = def.updateRule;
    collection.deleteRule = def.deleteRule;

    $app.save(collection);
  }

  console.log("[autodrive] schema bootstrap complete");
});
