<?php
  $query = $_SERVER["QUERY_STRING"];
  $url = null; 
	if (empty($query) || stristr($query, 'data')) {
    // header('Content-type: text/plain'); // http://en.wikipedia.org/wiki/Mime_type#Type_text
    $url = "http://www.net-flyer.net/DataFeed/vatsim-data.txt";
	} else if (stristr($query, 'metar')) {
    $query = str_replace('metar&','', $query);		
    $url = "http://metar.vatsim.net/data/metar.php?" . $query;
	}
  $data = file_get_contents($url);
	echo $data;
?>