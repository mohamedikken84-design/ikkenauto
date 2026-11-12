import assert from "node:assert/strict";
import {test} from "node:test";
import {vehicleMakes,suggestedModels} from "./vehicle-catalog";

test("dealer suggestions cover broad current and historic car makes",()=>{
 assert.ok(vehicleMakes.length>105,"Do not silently reduce suggested car brands");
 for(const make of ["Audi","Volkswagen","BMW","Mercedes-Benz","Toyota","Kia","BYD","Rover","Datsun","Jaguar","Lexus","Leapmotor","Volvo"])assert.ok(vehicleMakes.some(brand=>brand===make),make);
 assert.equal(new Set(vehicleMakes.map(m=>m.toLowerCase())).size,vehicleMakes.length);
});
test("model suggestions work for the selected make and are case insensitive",()=>{
 assert.ok(suggestedModels("AUDI").includes("Q7"));
 assert.ok(suggestedModels("volkswagen").includes("Golf"));
 assert.ok(suggestedModels("Mercedes-Benz").includes("GLS"));
 assert.deepEqual(suggestedModels("Onbekend Merk"),[]);
 assert.deepEqual(suggestedModels(undefined),[],"an empty form must not crash during server rendering");
 assert.deepEqual(suggestedModels(null),[],"missing make values must be handled safely");
 assert.deepEqual(suggestedModels("   "),[]);
});
