/**
 * Real Data API Test Tool
 * 
 * Verifies NOAA weather and EIA grid data is flowing correctly
 * Run this to confirm real data sources are working
 */

import { fetchRealClimateData, WEATHER_STATIONS } from './climateFetcher';
import { fetchRealEnergyData, getGridStatus, GRID_REGIONS } from './energyFetcher';

console.log('\n' + '='.repeat(70));
console.log('EN PENSENT REAL DATA API TEST');
console.log('='.repeat(70));

// Test 1: NOAA Climate API
console.log('\n📡 Test 1: NOAA Weather API');
console.log('-'.repeat(50));

async function testClimateAPI() {
  try {
    const station = 'KNYC'; // NYC Central Park
    console.log(`Fetching from station: ${station} (${WEATHER_STATIONS[station]?.name || 'Unknown'})`);
    
    const data = await fetchRealClimateData(station);
    
    if (data && data.verified) {
      console.log('✅ NOAA API: SUCCESS');
      console.log(`   Temperature: ${(data.point.temperature * 100).toFixed(1)}% normalized`);
      console.log(`   Pressure: ${(data.point.barometricPressure * 100).toFixed(1)}% normalized`);
      console.log(`   Wind: ${(data.point.windSpeed * 100).toFixed(1)}% normalized`);
      console.log(`   Source: ${data.source}`);
      console.log(`   Station: ${data.station}`);
      console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      return true;
    } else {
      console.log('❌ NOAA API: FAILED - No verified data');
      return false;
    }
  } catch (error) {
    console.log('❌ NOAA API: ERROR -', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Test 2: EIA Energy API
console.log('\n📡 Test 2: EIA Energy API');
console.log('-'.repeat(50));

async function testEnergyAPI() {
  try {
    const region = 'CAL'; // California ISO
    console.log(`Fetching from region: ${region} (${GRID_REGIONS[region]?.name || 'Unknown'})`);
    
    const data = await fetchRealEnergyData(region);
    
    if (data && data.verified) {
      console.log('✅ EIA API: SUCCESS');
      console.log(`   Grid Demand: ${(data.point.totalDemand * 100).toFixed(1)}% normalized`);
      console.log(`   Renewable Mix: ${(data.renewableMix * 100).toFixed(1)}%`);
      console.log(`   Total Generation: ${data.raw.generation ? Object.values(data.raw.generation).reduce((a, b) => a + b, 0).toFixed(0) : 'N/A'} MW`);
      console.log(`   Source: ${data.source}`);
      console.log(`   Region: ${data.raw.region}`);
      console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      return true;
    } else {
      console.log('❌ EIA API: FAILED - No verified data');
      return false;
    }
  } catch (error) {
    console.log('❌ EIA API: ERROR -', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Test 3: Grid Status
console.log('\n📡 Test 3: Grid Status Summary');
console.log('-'.repeat(50));

async function testGridStatus() {
  try {
    const regions = ['CAL', 'ERCO', 'MIDA', 'NY'];
    
    for (const region of regions) {
      const status = await getGridStatus(region);
      console.log(`\n   ${region} (${GRID_REGIONS[region]?.name || 'Unknown'}):`);
      console.log(`     Status: ${status.status}`);
      console.log(`     Renewable: ${status.renewablePercent}%`);
      console.log(`     Demand: ${status.demandMW.toLocaleString()} MW`);
      console.log(`     Verified: ${status.verified ? '✅' : '❌'}`);
    }
    return true;
  } catch (error) {
    console.log('❌ Grid Status: ERROR -', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('STARTING API TESTS...');
  console.log('='.repeat(70));
  
  const results = {
    climate: await testClimateAPI(),
    energy: await testEnergyAPI(),
    gridStatus: await testGridStatus()
  };
  
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log(`\nPassed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n✅ ALL REAL DATA APIS WORKING!');
    console.log('Dashboard Climate & Energy domains are showing live data.');
  } else {
    console.log('\n⚠️  SOME APIS FAILED');
    console.log('Check API keys and network connection.');
    console.log('\nTroubleshooting:');
    console.log('  1. Verify EIA API key is set in .env');
    console.log('  2. Check internet connection');
    console.log('  3. APIs may be temporarily down');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test complete at:', new Date().toLocaleString());
  console.log('='.repeat(70) + '\n');
}

runAllTests();
