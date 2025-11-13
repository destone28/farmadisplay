-- Script SQL per risolvere il problema display_id

-- Mostra lo stato attuale
SELECT 'Current pharmacies:' as info;
SELECT id, name, display_id FROM pharmacies;

-- Mostra lo stato della migrazione
SELECT 'Alembic version:' as info;
SELECT * FROM alembic_version;
