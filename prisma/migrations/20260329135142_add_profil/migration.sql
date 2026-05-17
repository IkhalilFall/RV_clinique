-- AlterTable
ALTER TABLE `user` ADD COLUMN `adresse` VARCHAR(191) NULL,
    ADD COLUMN `dateNaissance` DATETIME(3) NULL,
    ADD COLUMN `genre` VARCHAR(191) NULL,
    ADD COLUMN `lieuNaissance` VARCHAR(191) NULL,
    ADD COLUMN `situationMatrimoniale` VARCHAR(191) NULL;
