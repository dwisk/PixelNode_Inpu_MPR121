/**
 * PixelNode_Input_MPR121 
 * 
 * Inputs from Adafruits MPR121 touch sensor via a python subprocess.
 * 
 * --------------------------------------------------------------------------------------------------------------------
 * 
 * @author Amely Kling <mail@dwi.sk>
 *
 */


/* Includes
 * ==================================================================================================================== */

var util = require("util");
var _ = require('underscore');
var MPR121 = require('mpr121');

/* Class Constructor
 * ==================================================================================================================== */

// extending Effect
PixelNode_Input = require('pixelnode-input');

// define the Student class
function PixelNode_Input_MPR121(options,pixelData) {
  var self = this;
  PixelNode_Input_MPR121.super_.call(self, options, pixelData);
  this.className = "PixelNode_Input_MPR121";
}

// class inheritance 
util.inherits(PixelNode_Input_MPR121, PixelNode_Input);

// module export
module.exports = PixelNode_Input_MPR121;


/* Variables
 * ==================================================================================================================== */

PixelNode_Input_MPR121.prototype.default_options = {
	"crash_waittime": 1,
	"crash_cautious_lifetime": 20,
	"crash_cautious_waittime": 2,
	"i2c_bus": 2,
	"i2c_address": 0x5A,
	"offset": 0,
	"verbose": false
};
PixelNode_Input_MPR121.prototype.touchsensor = null;

var firstInit = 0;
var lastInit = 0;
var crashCount = 0;

var lastPins = [];


/* Overridden Methods
 * ==================================================================================================================== */

// init effect – override
PixelNode_Input_MPR121.prototype.init = function() {
	var self = this;

	lastInit = new Date();
	if (firstInit == 0) firstInit = new Date();

	// start
	console.log("Init Input MPR121".grey);

	// init input values
	var init_inputs = {};
	init_inputs["touches"] = [
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false
	];

	// init pixelNode data
	global.pixelNode.data.extend(["inputs",self.options.name], init_inputs);

	// start effect
	self.start(function(result) {
		// do offset
		if (self.options.offset != 0) {
			var segment1 = result.slice(self.options.offset);
			var segment2 = result.slice(0,self.options.offset);
			pins = segment1.concat(segment2);
		} else {
			pins = result;
		}

		// check if touch-point changes
		for (var i = pins.length - 1; i >= 0; i--) {
			if (pins[i] != lastPins[i]) {
				lastPins[i] = pins[i];
				global.pixelNode.data.set(["inputs", self.options.name, "touches", i], pins[i], !self.options.verbose);
			} 
		}
	});
}


/* Methods
 * ==================================================================================================================== */

// start python listener
PixelNode_Input_MPR121.prototype.start = function(callback) {
	var self = this;
 	
 	// setup sensor device 
 	self.touchsensor = new MPR121(self.options.i2c_address, self.options.i2c_bus);

 	// initialize sensor, on success start script
 	if (self.touchsensor.begin()) {

 		// Interval for reading the sonsor
 		setInterval(function() {
 			// get touch values
 			var t = self.touchsensor.touched();

 			// prepare some result array
 			var ret = [];

 			// loop through pins
 			for (var i = 0; i < 12; i++) {
 				// push status into array
 				ret.push (self.touchsensor.is_touched(i));
 			}
 			
 			// return status array
 			callback(ret);

 		},100);
 	};

}
