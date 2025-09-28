import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user to ensure they're authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Sample inventory data
    const inventoryData = [
      { part_id: 'RES-10K-001', description: '10kΩ Resistor 0.25W 5%', bin_id: 'A1', location_within_bin: 'Slot 3', quantity: 250, min_quantity: 50, part_link: 'https://www.digikey.com/product-detail/en/yageo/CFR-25JB-52-10K/10KQBK-ND/338', qr_code: 'QR-RES-10K-001', is_sensitive: false },
      { part_id: 'CAP-100UF-001', description: '100µF Electrolytic Capacitor 25V', bin_id: 'B2', location_within_bin: 'Drawer 1', quantity: 85, min_quantity: 25, part_link: 'https://www.digikey.com/product-detail/en/panasonic-electronic-components/EEU-FR1E101B/P122-ND/76779', qr_code: 'QR-CAP-100UF-001', is_sensitive: false },
      { part_id: 'IC-MCU-001', description: 'ARM Cortex-M4 Microcontroller 32-bit', bin_id: 'C1', location_within_bin: 'Anti-static bag', quantity: 45, min_quantity: 10, part_link: 'https://www.digikey.com/product-detail/en/stmicroelectronics/STM32F407VGT6/497-11147-ND/2063877', qr_code: 'QR-IC-MCU-001', is_sensitive: false },
      { part_id: 'CONN-USB-001', description: 'USB Type-C Connector SMD', bin_id: 'D3', location_within_bin: 'Small parts bin', quantity: 120, min_quantity: 20, part_link: 'https://www.digikey.com/product-detail/en/amphenol-icc-fci/10118194-0001LF/609-4618-1-ND/2785382', qr_code: 'QR-CONN-USB-001', is_sensitive: false },
      { part_id: 'XTAL-16MHZ-001', description: '16MHz Crystal Oscillator ±20ppm', bin_id: 'E1', location_within_bin: 'Crystal drawer', quantity: 75, min_quantity: 15, part_link: 'https://www.digikey.com/product-detail/en/abracon-llc/ABM8G-16.000MHZ-4Y-T3/535-12327-1-ND/4355619', qr_code: 'QR-XTAL-16MHZ-001', is_sensitive: false },
      { part_id: 'CRYPTO-CHIP-001', description: 'Hardware Security Module - FIPS 140-2 Level 3 (Export Restricted)', bin_id: 'S2', location_within_bin: 'Secure Cabinet B', quantity: 3, min_quantity: 5, part_link: 'https://internal-catalog.company.com/crypto-chip-001', qr_code: 'QR-CRYPTO-CHIP-001', is_sensitive: true },
      { part_id: 'LED-RED-001', description: 'Red LED 5mm High-Brightness', bin_id: 'E1', location_within_bin: 'Bin 12', quantity: 150, min_quantity: 50, part_link: 'https://www.digikey.com/product-detail/en/kingbright/WP7113ID/754-1264-ND/1747663', qr_code: 'QR-LED-RED-001', is_sensitive: false },
      { part_id: 'WIRE-22AWG-001', description: '22AWG Hookup Wire (Red) - 100ft Spool', bin_id: 'F1', location_within_bin: 'Wire Rack', quantity: 8, min_quantity: 10, part_link: 'https://www.digikey.com/product-detail/en/alpha-wire/3051-RD005/A3051R-100-ND/280895', qr_code: 'QR-WIRE-22AWG-001', is_sensitive: false },
      { part_id: 'SENSOR-TEMP-001', description: 'Digital Temperature Sensor - High Precision', bin_id: 'G2', location_within_bin: 'Sensor Drawer', quantity: 30, min_quantity: 15, part_link: 'https://www.analog.com/en/products/adt7420.html', qr_code: 'QR-SENSOR-TEMP-001', is_sensitive: false },
      { part_id: 'PSU-5V-001', description: '5V 2A Switching Power Supply Module', bin_id: 'H1', location_within_bin: 'Power Supply Shelf', quantity: 18, min_quantity: 8, part_link: 'https://www.meanwell.com/webapp/product/search.aspx?prod=RS-15-5', qr_code: 'QR-PSU-5V-001', is_sensitive: false }
    ];

    // Insert inventory data
    const { data: inventoryResult, error: inventoryError } = await supabase
      .from('inventory')
      .upsert(inventoryData, { onConflict: 'part_id' });

    if (inventoryError) {
      console.error('Error inserting inventory:', inventoryError);
      return NextResponse.json({ error: 'Failed to insert inventory data', details: inventoryError }, { status: 500 });
    }

    // Verify the data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('inventory')
      .select('part_id, quantity')
      .limit(10);

    if (verifyError) {
      return NextResponse.json({ error: 'Failed to verify data', details: verifyError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${inventoryData.length} inventory items`,
      data: verifyData
    });

  } catch (error) {
    console.error('Error in populate-db route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}