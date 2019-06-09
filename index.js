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
	"i2c_bus": 2,
	"i2c_address": 0x5A,
	"offset": 0,
	"verbose": false,
	"timer": 100,
	"treshold_touch": 12,
	"treshold_release": 6,
	"pincount": 12
};
PixelNode_Input_MPR121.prototype.touchsensor = null;

PixelNode_Input_MPR121.prototype.lastPins = [];
PixelNode_Input_MPR121.prototype.pins = [];
PixelNode_Input_MPR121.prototype.last_result = [];


/* Overridden Methods
 * ==================================================================================================================== */

// init effect – override
PixelNode_Input_MPR121.prototype.init = function() {
	var self = this;

	// start
	console.log("Init Input MPR121".grey, "on", self.options.i2c_address, self.options.i2c_bus);

	// init input values
	self.init_inputs = Object.assign({});
	self.init_inputs["touches"] = [];
	self.pins = [];
	self.lastPins = [];
	for (var i = 0; i < self.options.pincount; i++) {
		self.init_inputs["touches"][i] = false;
		self.pins[i] = false;
		self.lastPins[i] = false;
	};

	// init pixelNode data
	global.pixelNode.data.extend(["inputs",self.options.name], self.init_inputs);


	// start effect
	self.start(function(result) {
		// do offset
		if (self.options.offset != 0) {
			var segment1 = result.slice(self.options.offset);
			var segment2 = result.slice(0,self.options.offset);
			self.pins = segment1.concat(segment2);
		} else {
			self.pins = result;
		}
		self.pins[12] = self.options.name;

		// check if touch-point changes
		for (var i = self.pins.length - 1; i >= 0; i--) {
			if (self.pins[i] !== self.lastPins[i]) {
				self.lastPins[i] = self.pins[i];
				global.pixelNode.data.set(["inputs", self.options.name, "touches", i], self.pins[i], !self.options.verbose);
			} 
		}
	});
}


/* Methods
 * ==================================================================================================================== */

// start python listener
PixelNode_Input_MPR121.prototype.start = function(callback) {
	var self = this;
	
	self.last_result = [];
	for (var i = 0; i < self.options.pincount; i++) {
		self.last_result[i] = false;
	};
 	
 	// setup sensor device 
 	self.touchsensor = new MPR121(self.options.i2c_address, self.options.i2c_bus);

 	// initialize sensor, on success start script
 	if (self.touchsensor.begin()) {
 		self.touchsensor.set_thresholds(self.options.treshold_touch, self.options.treshold_release);

 		// Interval for reading the sonsor
 		setInterval(function() {
			self.touchsensor.set_thresholds(self.options.treshold_touch, self.options.treshold_release);

 			// check if config is correct, otherwise send self.last_result
 			// probably the i2c-bus got switched
 			if (self.touchsensor.config() != 32) {
 				callback(self.last_result);
 			
 			// get data
 			} else {
	 			// get touch values
	 			var t = self.touchsensor.touched();

	 			// prepare some result array
	 			var ret = [];

	 			// loop through pins
	 			for (var i = 0; i < self.options.pincount; i++) {
	 				// push status into array
	 				ret.push ((t & (1 << i)) > 0);
	 				//ret.push (self.touchsensor.is_touched(i));
	 			}

	 			// return status array
				callback(ret);

				// remember last result
				self.last_result = ret;
			}	
 		}, self.options.timer);
 	};

}
