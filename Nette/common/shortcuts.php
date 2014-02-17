<?php

/**
 * This file is part of the Nette Framework (http://nette.org)
 * Copyright (c) 2004 David Grudl (http://davidgrudl.com)
 */

use Nette\Diagnostics\Debugger;


if (!function_exists('dump')) {
	/**
	 * Nette\Diagnostics\Debugger::dump() shortcut.
	 * @tracySkipLocation
	 */
	function dump($var)
	{
		foreach (func_get_args() as $arg) {
			Debugger::dump($arg);
		}
		return $var;
	}
}


if (!function_exists('dlog')) {
	/**
	 * Nette\Diagnostics\Debugger::log() shortcut.
	 */
	function dlog($var = NULL)
	{
		if (func_num_args() === 0) {
			Debugger::log(new Exception, 'dlog');
		}
		foreach (func_get_args() as $arg) {
			Debugger::log($arg, 'dlog');
		}
		return $var;
	}
}


}
