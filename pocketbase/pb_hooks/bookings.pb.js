/// <reference path="../pb_data/types.d.ts" />

// ---------------------------------------------------------------------------
// Date-conflict engine
//
// A vehicle cannot be double-booked: reject any create/update that overlaps
// an existing non-cancelled/non-draft booking's [pickup, return) window, and
// reject bookings against a vehicle that is currently under maintenance or
// out of service.
//
// NOTE: hook logic is inlined directly into each callback (rather than
// calling a shared top-level helper function) because this PocketBase JSVM
// build does not reliably resolve function declarations referenced from a
// separately-registered hook callback within the same file.
// ---------------------------------------------------------------------------
onRecordCreate((e) => {
  const record = e.record;
  const status = record.get("status");

  if (status === "cancelled" || status === "draft") {
    e.next();
    return;
  }

  const vehicleId = record.get("vehicle");
  const pickup = record.get("pickup_datetime");
  const ret = record.get("return_datetime");

  if (!vehicleId || !pickup || !ret) {
    e.next();
    return;
  }

  if (new Date(pickup) >= new Date(ret)) {
    throw new BadRequestError("return_datetime must be after pickup_datetime.");
  }

  const vehicle = $app.findRecordById("vehicles", vehicleId);
  if (vehicle.get("status") === "maintenance" || vehicle.get("status") === "out_of_service") {
    throw new BadRequestError("This vehicle is currently unavailable (maintenance / out of service).");
  }

  const overlapping = $app.findRecordsByFilter(
    "bookings",
    "vehicle = {:vehicleId} && status != 'cancelled' && status != 'draft' && id != {:id} && pickup_datetime < {:ret} && return_datetime > {:pickup}",
    "",
    1,
    0,
    { vehicleId, id: record.id || "new", ret, pickup }
  );

  if (overlapping.length > 0) {
    throw new BadRequestError("Vehicle is already booked for an overlapping date range.");
  }

  e.next();
}, "bookings");

onRecordUpdate((e) => {
  const record = e.record;
  const status = record.get("status");

  if (status === "cancelled" || status === "draft") {
    e.next();
    return;
  }

  const vehicleId = record.get("vehicle");
  const pickup = record.get("pickup_datetime");
  const ret = record.get("return_datetime");

  if (!vehicleId || !pickup || !ret) {
    e.next();
    return;
  }

  if (new Date(pickup) >= new Date(ret)) {
    throw new BadRequestError("return_datetime must be after pickup_datetime.");
  }

  const vehicle = $app.findRecordById("vehicles", vehicleId);
  if (vehicle.get("status") === "maintenance" || vehicle.get("status") === "out_of_service") {
    throw new BadRequestError("This vehicle is currently unavailable (maintenance / out of service).");
  }

  const overlapping = $app.findRecordsByFilter(
    "bookings",
    "vehicle = {:vehicleId} && status != 'cancelled' && status != 'draft' && id != {:id} && pickup_datetime < {:ret} && return_datetime > {:pickup}",
    "",
    1,
    0,
    { vehicleId, id: record.id || "new", ret, pickup }
  );

  if (overlapping.length > 0) {
    throw new BadRequestError("Vehicle is already booked for an overlapping date range.");
  }

  e.next();
}, "bookings");

// ---------------------------------------------------------------------------
// Automatic status transitions
//
// - Booking -> "active"    => vehicle -> "rented"
// - Booking -> "completed" => vehicle mileage synced from return_mileage;
//                             vehicle -> "maintenance" if the booking has an
//                             unresolved severe damage report, else
//                             "available".
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  const booking = e.record;
  const status = booking.get("status");

  if (status === "active" || status === "completed") {
    const vehicle = $app.findRecordById("vehicles", booking.get("vehicle"));

    if (status === "active") {
      if (vehicle.get("status") !== "rented") {
        vehicle.set("status", "rented");
        $app.save(vehicle);
      }
    } else {
      const returnMileage = booking.get("return_mileage");
      if (returnMileage && returnMileage > vehicle.get("mileage")) {
        vehicle.set("mileage", returnMileage);
      }

      const severeUnresolvedDamages = $app.findRecordsByFilter(
        "damages",
        "booking = {:bookingId} && severity = 'severe' && resolved = false",
        "",
        1,
        0,
        { bookingId: booking.id }
      );

      vehicle.set("status", severeUnresolvedDamages.length > 0 ? "maintenance" : "available");
      $app.save(vehicle);
    }
  }

  e.next();
}, "bookings");

onRecordAfterUpdateSuccess((e) => {
  const booking = e.record;
  const status = booking.get("status");

  if (status === "active" || status === "completed") {
    const vehicle = $app.findRecordById("vehicles", booking.get("vehicle"));

    if (status === "active") {
      if (vehicle.get("status") !== "rented") {
        vehicle.set("status", "rented");
        $app.save(vehicle);
      }
    } else {
      const returnMileage = booking.get("return_mileage");
      if (returnMileage && returnMileage > vehicle.get("mileage")) {
        vehicle.set("mileage", returnMileage);
      }

      const severeUnresolvedDamages = $app.findRecordsByFilter(
        "damages",
        "booking = {:bookingId} && severity = 'severe' && resolved = false",
        "",
        1,
        0,
        { bookingId: booking.id }
      );

      vehicle.set("status", severeUnresolvedDamages.length > 0 ? "maintenance" : "available");
      $app.save(vehicle);
    }
  }

  e.next();
}, "bookings");
