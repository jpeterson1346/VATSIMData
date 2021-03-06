﻿<?php
	// Set header, however not working since for some reasons header is already sent
	// ob_start();
	// header('Content-type: text/plain'); // http://en.wikipedia.org/wiki/Mime_type#Type_text

	//
	// My standard curl reading
	//
	function curlRead($url, &$curl_errno, &$curl_error, &$http_status) {
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
		curl_setopt($ch, CURLOPT_TIMEOUT, 3);
		curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4 );
		$data = curl_exec($ch);
		$curl_errno = curl_errno($ch); // 0 is OK
		$curl_error = curl_error($ch);
		$http_status = 666; // curl error
		if (!$curl_errno) {
			// http://php.net/manual/de/function.curl-getinfo.php
			$info = curl_getinfo($ch);
			$http_status = $info['http_code'];
		} 
		curl_close($ch);
		return $data;
	}

	//
	// Main
	// 
	
	$query = $_SERVER["QUERY_STRING"];
	$url = null;
	$data = null;
	$knownQuery = (	stristr($query, 'data') || 
					stristr($query, 'metar') || 
					stristr($query, 'testurls1') ||
					stristr($query, 'testurls2')
					);

	// list of servers, for simplicity directly "hardcoded" here
	// http://data.vattastic.com/vatsim-servers.txt
	// http://status.vatsim.net/status.txt (this contains the URLs)
	$urls = array (
			0 => 
			"http://info.vroute.net/vatsim-data.txt",
			"http://data.vattastic.com/vatsim-data.txt"

			// "http://www.pcflyer.net/DataFeed/vatsim-data.txt", // slow
			// "http://fsproshop.com/servinfo/vatsim-data.txt", // slow
	);
	
	// testing?
	if (stristr($query, 'testurls')) {
		array_push($urls, "http://metar.vatsim.net/metar.php?id=eddf");
	}

	// count
	$urlsCount = count($urls);
	
	// context for file_get_contents
	// http://de1.php.net/manual/en/context.http.php
	$context = array('http' => array(
		'timeout' => 3, 'request_fulluri' => true, 'header' => "User-agent: PHP",
		)
	);
	$urlctx = stream_context_create($context);
	$curl_errno = 0;
	$curl_error = "";
	$http_status = 666;
	
	if (empty($query) || stristr($query, 'data') || !$knownQuery) {
		
		//
		// Data proxy
		//
		$index = rand(0, $urlsCount-1);
		$index2 = $index + 1;
		if ($index2 >= $urlsCount) $index2 = 0;
		$url = $urls[$index];

		// retrieve data
		// http://stackoverflow.com/questions/10189232/file-get-contents-timeout
		$data = curlRead($url, $curl_errno, $curl_error, $http_status);
		if ($curl_errno > 0 || $http_status != 200) {
			echo "; cURL Error ($curl_errno): $curl_error for $url http-status: $http_status" . "\r\n";

			// try second time
			$url = $urls[$index2];
			$data = curlRead($url, $curl_errno, $curl_error, $http_status);
				if ($curl_errno > 0 || $http_status != 200) {
					echo "; cURL Error ($curl_errno): $curl_error for $url http-status: $http_status" . "\r\n";
			} else {
				echo "; Proxy for " . $index . " / " . $url . "\r\n"; 
				echo $data;
			}
		} else {
			echo "; Proxy for " . $index . " / " . $url . "\r\n"; 
			echo $data;
		}

	} else if (stristr($query, 'metar')) {
		
		// 
		// METAR proxy (?metar&id=eddf)
		//
		$query = str_replace('metar&','', $query);		
		$url = "http://metar.vatsim.net/metar.php?" . $query;
		
		// retrieve data changed to curl because of better error handling
		$data = curlRead($url, $curl_errno, $curl_error, $http_status);
		if ($curl_errno > 0 || $http_status != 200) {
			echo "; cURL Error ($curl_errno): $curl_error for $url http-status: $http_status" . "\r\n";
		} else {
			echo $data;
		}

	} else if (stristr($query, 'testurls1')) {
		// test all URLs and report time
		// http://php.net/manual/en/function.curl-setopt.php
		echo "Testing $urlsCount URLs via CURL<br/>";
		for ($i = 0; $i < $urlsCount; $i++) {
			$url = $urls[$i];
			$time_start = microtime(true);
			$data = curlRead($url, $curl_errno, $curl_error, $http_status);
			$time_end = microtime(true);
			echo "$i: $url ";
			if ($curl_errno > 0 || $http_status != 200) {
				echo "; cURL Error ($curl_errno): $curl_error for $url http-status: $http_status" . "\r\n";
			}
			$time = $time_end - $time_start;
			echo "time: $time ms<br/>";
		}
	} else if (stristr($query, 'testurls2')) {
		
		// test all URLs
		// and report time
		echo "Testing $urlsCount URLs<br/>";
		for ($i = 0; $i < $urlsCount; $i++) {
			$url = $urls[$i];
			$time_start = microtime(true);
			echo "$i: $url ";
			$data = file_get_contents($url);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			echo "time: $time ms<br/>";
		}
	} 
?>