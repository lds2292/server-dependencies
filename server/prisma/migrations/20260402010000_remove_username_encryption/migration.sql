-- DropIndex
DROP INDEX "User_usernameHash_key";

-- AlterTable: drop usernameHash column
ALTER TABLE "User" DROP COLUMN "usernameHash";

-- AddUniqueConstraint on username (plaintext)
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
