const dbName = process.env.MONGODB_INITDB_DATABASE || "esim_market";
const appUser = process.env.MONGODB_APP_USERNAME;
const appPassword = process.env.MONGODB_APP_PASSWORD;

if (!appUser) {
    throw new Error("MONGODB_APP_USERNAME is not defined");
}

if (!appPassword) {
    throw new Error("MONGODB_APP_PASSWORD is not defined");
}

print(`Initializing application database: ${dbName}`);

const appDb = db.getSiblingDB(dbName);

// Materialize the database.
if (!appDb.getCollectionNames().includes("_bootstrap")) {
    appDb.createCollection("_bootstrap");
}

// Avoid duplicate-user failure if this script is executed manually.
const existingUser = appDb.getUser(appUser);

if (existingUser === null) {
    appDb.createUser({
        user: appUser,
        pwd: appPassword,
        roles: [
            {
                role: "readWrite",
                db: dbName
            }
        ]
    });

    print(`Created application user '${appUser}' on '${dbName}'`);
} else {
    print(`Application user '${appUser}' already exists`);
}

print(`Initialization completed for '${dbName}'`);