<?php

	// Set header, however not working since for some reasons header is already sent
	// header('Content-type: text/plain'); // http://en.wikipedia.org/wiki/Mime_type#Type_text
	// header('Content-type: text/plain');
	
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
			// actually only listed as server list provider, but has data also
			"http://www.net-flyer.net/DataFeed/vatsim-data.txt",
			// No access
			// "http://www.pcflyer.net/DataFeed/vatsim-data.txt",
			// Hangs sometimes
			// "http://www.klain.net/sidata/vatsim-data.txt",
			"http://info.vroute.net/vatsim-data.txt",
			// fast in browser, but slow / denied via PHP
			// "http://fsproshop.com/servinfo/vatsim-data.txt",
			// "http://69.89.31.208/servinfo/vatsim-data.txt",
			"http://data.vattastic.com/vatsim-data.txt"
	);
	$urlsCount = count($urls);
	
	// context for file_get_contents
	// http://de1.php.net/manual/en/context.http.php
	$context = array('http' => array(
		'timeout' => 3,
		'request_fulluri' => true
		// 'header' => "User-agent: PHP",
		)
	);
	$urlctx = stream_context_create($context);

	if (empty($query) || stristr($query, 'data') || !$knownQuery) {
		
		//
		// Data proxy
		//
		$index = rand(0, $urlsCount-1);
		$url = $urls[$index];
		// echo "; " . $index . " / " . $url; 

		// retrieve data
		// http://stackoverflow.com/questions/10189232/file-get-contents-timeout
		$data = file_get_contents($url, false, $urlctx);
		echo $data;

	} else if (stristr($query, 'metar')) {
		
		// 
		// METAR proxy (?metar&id=eddf)
		//
		$query = str_replace('metar&','', $query);		
		$url = "http://metar.vatsim.net/data/metar.php?" . $query;
		
		// retrieve data
		// changed to curl because of better error handling
		// $data = file_get_contents($url);
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
		curl_setopt($ch, CURLOPT_TIMEOUT, 3);
		curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4 );
		$data = curl_exec($ch);
		$curl_errno = curl_errno($ch);
		$curl_error = curl_error($ch);
		curl_close($ch);
		if ($curl_errno > 0) {
			// I create a one line comment which can be displayed in JavaScript
			echo "; cURL Error ($curl_errno): $curl_error for $url";
		} else {
			echo $data;
		}

	} else if (stristr($query, 'testurls1')) {
		// test all URLs
		// and report time
		// http://php.net/manual/en/function.curl-setopt.php
		echo "Testing $urlsCount URLs via CURL<br/>";
		for ($i = 0; $i < $urlsCount; $i++) {
			$url = $urls[$i];
			$time_start = microtime(true);
			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
			curl_setopt($ch, CURLOPT_TIMEOUT, 3);
			curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4 );
			$data = curl_exec($ch);
			$curl_errno = curl_errno($ch);
			$curl_error = curl_error($ch);
			curl_close($ch);
			$time_end = microtime(true);
			echo "$i: $url ";
			if ($curl_errno > 0) {
			  echo "cURL Error ($curl_errno): $curl_error ";
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