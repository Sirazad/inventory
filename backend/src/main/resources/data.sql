-- Insert Pyarr Calendar Configuration (31 months × 20 days = 620 days)
-- God month numbers calculated based on consecutive months per god

INSERT INTO calendar_months (month_number, month_name, season, god_name, god_month_number) VALUES
    (1, 'Szándék', 'Hideg évszak', 'Kyel', 1),
    (2, 'Akarat', 'Hideg évszak', 'Kyel', 2),
    (3, 'Harag', 'Hideg évszak', 'Kyel', 3),
    (4, 'Végítélet', 'Hideg évszak', 'Kyel', 4),
    (5, 'Sikolyok', 'Hideg évszak', 'Darton', 1),
    (6, 'Csend', 'Hideg évszak', 'Darton', 2),
    (7, 'Kacaj', 'Hideg évszak', 'Darton', 3),
    (8, 'Pengék', 'Hideg évszak', 'Uwel', 1),
    (9, 'Csontok', 'Hideg évszak', 'Uwel', 2),
    (10, 'Hamvak', 'Hideg évszak', 'Uwel', 3),
    (11, 'Lant', 'Meleg évszak', 'Albourne', 1),
    (12, 'Álmok', 'Meleg évszak', 'Albourne', 2),
    (13, 'Ébredés', 'Meleg évszak', 'Albourne', 3),
    (14, 'Áldozat', 'Meleg évszak', 'Adron', 1),
    (15, 'Engesztelés', 'Meleg évszak', 'Adron', 2),
    (16, 'Lángok', 'Meleg évszak', 'Adron', 3),
    (17, 'Feloldozás', 'Meleg évszak', 'Adron', 4),
    (18, 'Ifjak', 'Meleg évszak', 'Krad', 1),
    (19, 'Bölcsek', 'Meleg évszak', 'Krad', 2),
    (20, 'Beavatottak', 'Meleg évszak', 'Krad', 3),
    (21, 'Felemelkedők', 'Meleg évszak', 'Krad', 4),
    (22, 'Fogadalmak', 'Esős évszak', 'Dreina', 1),
    (23, 'Esküvések', 'Esős évszak', 'Dreina', 2),
    (24, 'Fohászok', 'Esős évszak', 'Dreina', 3),
    (25, 'Hullámok', 'Esős évszak', 'Antoh', 1),
    (26, 'Áradás', 'Esős évszak', 'Antoh', 2),
    (27, 'Tengercsend', 'Esős évszak', 'Antoh', 3),
    (28, 'Zivatar', 'Esős évszak', 'Arel', 1),
    (29, 'Kék Acél', 'Esős évszak', 'Arel', 2),
    (30, 'Sólyomszárny', 'Esős évszak', 'Arel', 3),
    (31, 'Holdak és vándorok', 'Esős évszak', 'Arel', 4)
ON CONFLICT (month_number) DO NOTHING;

-- Update existing characters with null calendar dates to default values
UPDATE characters 
SET current_year = 3692, current_day = 1 
WHERE current_year IS NULL OR current_day IS NULL;
