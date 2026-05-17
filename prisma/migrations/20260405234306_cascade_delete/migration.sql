-- DropForeignKey
ALTER TABLE `disponibilite` DROP FOREIGN KEY `Disponibilite_medecinId_fkey`;

-- DropForeignKey
ALTER TABLE `rdv` DROP FOREIGN KEY `RDV_medecinId_fkey`;

-- DropForeignKey
ALTER TABLE `rdv` DROP FOREIGN KEY `RDV_patientId_fkey`;

-- DropIndex
DROP INDEX `Disponibilite_medecinId_fkey` ON `disponibilite`;

-- DropIndex
DROP INDEX `RDV_medecinId_fkey` ON `rdv`;

-- DropIndex
DROP INDEX `RDV_patientId_fkey` ON `rdv`;

-- AddForeignKey
ALTER TABLE `Disponibilite` ADD CONSTRAINT `Disponibilite_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RDV` ADD CONSTRAINT `RDV_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RDV` ADD CONSTRAINT `RDV_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
