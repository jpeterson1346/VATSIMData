<?php
	$query = $_SERVER["QUERY_STRING"];
	$url = null; 
	if (empty($query) || stristr($query, 'data')) {
		
		//
		// Data proxy
		//
	
		// Set header, however not working since for some reasons header is already sent
		// header('Content-type: text/plain'); // http://en.wikipedia.org/wiki/Mime_type#Type_text
		
		// list of servers, for simplicity directly "hardcoded" here
		// see: http://data.vattastic.com/vatsim-servers.txt
		$urls = array (
			0 => "http://www.net-flyer.net/DataFeed/vatsim-data.txt",
			"http://www.klain.net/sidata/vatsim-data.txt",
			"http://fsproshop.com/servinfo/vatsim-data.txt",
			"http://info.vroute.net/vatsim-data.txt",
			"http://data.vattastic.com/vatsim-data.txt"
		);
		$index = rand(0,4); // integer 0-4
		$url = $urls[$index];
		// echo "; " . $index . " / " . $url; 
		
	} else if (stristr($query, 'metar')) {
		
		// 
		// METAR proxy
		//
		
		$query = str_replace('metar&','', $query);		
		$url = "http://metar.vatsim.net/data/metar.php?" . $query;
	}
	
	// retrieve data
	$data = file_get_contents($url);
	echo $data;
?>