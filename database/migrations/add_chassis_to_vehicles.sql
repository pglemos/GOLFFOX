-- Add chassis column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS chassis TEXT;

-- Add comment to the column
COMMENT ON COLUMN vehicles.chassis IS 'Número do chassi do veículo';
